import type { Context } from "hono";
import { pool } from "../config/db.js";
import type { Student } from "./students.model.js";
import type { ResultSetHeader } from "mysql2";

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation function
const validateStudent = (data: any, isUpdate: boolean = false) => {
  const errors: string[] = [];

  // Required fields for creation
  if (!isUpdate) {
    if (!data.first_name) errors.push("first_name is required");
    if (!data.last_name) errors.push("last_name is required");
    if (!data.email) errors.push("email is required");
    if (!data.course) errors.push("course is required");
  }

  // Email validation
  if (data.email && !emailRegex.test(data.email)) {
    errors.push("Invalid email format");
  }

  // Age validation
  if (data.age !== undefined) {
    const age = Number(data.age);
    if (isNaN(age) || age < 16 || age > 100) {
      errors.push("Age must be a number between 16 and 100");
    }
  }

  // GPA validation
  if (data.gpa !== undefined) {
    const gpa = Number(data.gpa);
    if (isNaN(gpa) || gpa < 0.0 || gpa > 4.0) {
      errors.push("GPA must be a number between 0.0 and 4.0");
    }
  }

  // Year level validation
  if (data.year_level !== undefined) {
    const year = Number(data.year_level);
    if (isNaN(year) || year < 1 || year > 4) {
      errors.push("Year level must be between 1 and 4");
    }
  }

  // Enrollment status validation
  if (data.enrollment_status && !['Active', 'Inactive'].includes(data.enrollment_status)) {
    errors.push("Enrollment status must be 'Active' or 'Inactive'");
  }

  return errors;
};

export const getStudents = async (c: Context) => {
  try {
    const [rows] = await pool.query<Student[]>('SELECT * FROM students');
    return c.json(rows);
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Error getting students' }, 500);
  }
};

export const getStudentById = async (c: Context) => {
  try {
    const { id } = c.req.param();
    const [rows] = await pool.query<Student[]>('SELECT * FROM students WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return c.json({ message: 'Student not found' }, 404);
    }
    
    return c.json(rows[0]);
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Error getting student' }, 500);
  }
};

export const createStudent = async (c: Context) => {
  try {
    const data = await c.req.json();
    
    // Validate input
    const errors = validateStudent(data, false);
    if (errors.length > 0) {
      return c.json({ message: 'Validation failed', errors }, 400);
    }

    const { first_name, last_name, email, age, course, year_level, gpa, enrollment_status } = data;

    // Check if email already exists
    const [existing] = await pool.query<Student[]>('SELECT * FROM students WHERE email = ?', [email]);
    if (existing.length > 0) {
      return c.json({ message: 'Email already exists' }, 400);
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO students (first_name, last_name, email, age, course, year_level, gpa, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, age, course, year_level, gpa, enrollment_status || 'Active']
    );

    const [newStudent] = await pool.query<Student[]>('SELECT * FROM students WHERE id = ?', [result.insertId]);
    return c.json(newStudent[0], 201);
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Error creating student' }, 500);
  }
};

export const updateStudent = async (c: Context) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();

    // Validate input
    const errors = validateStudent(data, true);
    if (errors.length > 0) {
      return c.json({ message: 'Validation failed', errors }, 400);
    }

    // Check if student exists
    const [existing] = await pool.query<Student[]>('SELECT * FROM students WHERE id = ?', [id]);
    if (existing.length === 0) {
      return c.json({ message: 'Student not found' }, 404);
    }

    // Check if email is being changed and if new email already exists
    if (data.email && data.email !== existing[0].email) {
      const [emailCheck] = await pool.query<Student[]>('SELECT * FROM students WHERE email = ? AND id != ?', [data.email, id]);
      if (emailCheck.length > 0) {
        return c.json({ message: 'Email already exists' }, 400);
      }
    }

    const { first_name, last_name, email, age, course, year_level, gpa, enrollment_status } = data;

    await pool.query<ResultSetHeader>(
      'UPDATE students SET first_name = ?, last_name = ?, email = ?, age = ?, course = ?, year_level = ?, gpa = ?, enrollment_status = ? WHERE id = ?',
      [first_name, last_name, email, age, course, year_level, gpa, enrollment_status, id]
    );

    const [updatedStudent] = await pool.query<Student[]>('SELECT * FROM students WHERE id = ?', [id]);
    return c.json(updatedStudent[0]);
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Error updating student' }, 500);
  }
};

export const deleteStudent = async (c: Context) => {
  try {
    const { id } = c.req.param();

    // Check if student exists
    const [existing] = await pool.query<Student[]>('SELECT * FROM students WHERE id = ?', [id]);
    if (existing.length === 0) {
      return c.json({ message: 'Student not found' }, 404);
    }

    await pool.query('DELETE FROM students WHERE id = ?', [id]);
    return c.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Error deleting student' }, 500);
  }
};