import { Hono } from 'hono';
import { createStudent, getStudents, getStudentById, updateStudent, deleteStudent } from './students.controller';

const studentsRoute = new Hono();

studentsRoute.get('/', getStudents);
studentsRoute.get('/:id', getStudentById);
studentsRoute.post('/', createStudent);
studentsRoute.put('/:id', updateStudent);
studentsRoute.delete('/:id', deleteStudent);

export default studentsRoute;