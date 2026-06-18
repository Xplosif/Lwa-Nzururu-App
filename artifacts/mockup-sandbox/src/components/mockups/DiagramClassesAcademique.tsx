import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
classDiagram
    class Student {
        +int id
        +string registrationNumber
        +string lastName
        +string postnom
        +string firstName
        +string gender
        +string phoneNumber
        +string dateOfBirth
        +string placeOfBirth
        +string fatherName
        +string motherName
        +string fonction
        +int classId
        +string academicYear
        +getBulletin(semester) Bulletin
        +getGrades() Grade[]
    }
    class Class {
        +int id
        +string name
        +string level
        +string academicYear
        +listStudents() Student[]
        +getTitulaire() User
        +getSubjects() Subject[]
    }
    class Subject {
        +int id
        +string name
        +int coefficient
        +int maxPoints
        +string category
    }
    class Grade {
        +int id
        +int studentId
        +int subjectId
        +int classId
        +string period
        +real value
        +computeWeighted() real
    }
    class CourseAssignment {
        +int id
        +int teacherId
        +int subjectId
        +int classId
        +string academicYear
    }
    class Deliberation {
        +int id
        +int classId
        +string semester
        +string status
        +boolean approvedByProviseur
        +approve() void
        +addBonus(studentId, pts) void
    }
    class Archive {
        +int id
        +string academicYear
        +json data
        +restore() void
    }

    Class "1" --> "0..*" Student : contient
    Class "1" --> "0..*" CourseAssignment : gere par
    Subject "1" --> "0..*" CourseAssignment : enseigne dans
    Student "1" --> "0..*" Grade : obtient
    Subject "1" --> "0..*" Grade : note par
    Class "1" --> "0..*" Deliberation : fait l'objet de
    Class "1" --> "0..*" Archive : archivee dans
`;

export default function DiagramClassesAcademique() {
  return <DiagramPage title="Diagramme de classes — Module Academique" subtitle="Eleves, Classes, Matieres, Notes, Deliberation, Archives" diagram={D} />;
}
