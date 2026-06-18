import { DiagramPage } from "../../lib/DiagramWrapper";

const D = `
classDiagram
    class User {
        +id: int
        +username: string
        +passwordHash: string
        +fullName: string
        +role: Role
        +isFirstLogin: boolean
        +classId: int
    }
    class Student {
        +id: int
        +registrationNumber: string
        +lastName: string
        +firstName: string
        +gender: string
        +phoneNumber: string
        +classId: int
        +academicYear: string
    }
    class Class {
        +id: int
        +name: string
        +level: string
        +academicYear: string
    }
    class Subject {
        +id: int
        +name: string
        +coefficient: int
        +maxPoints: int
        +category: string
    }
    class Grade {
        +id: int
        +studentId: int
        +subjectId: int
        +classId: int
        +period: string
        +value: float
    }
    class CourseAssignment {
        +id: int
        +teacherId: int
        +subjectId: int
        +classId: int
        +academicYear: string
    }
    class Deliberation {
        +id: int
        +classId: int
        +semester: string
        +status: string
        +approvedByProviseur: boolean
    }
    class Archive {
        +id: int
        +academicYear: string
        +data: json
    }
    class Message {
        +id: int
        +senderId: int
        +recipientId: int
        +content: string
        +isRead: boolean
    }

    User "1" --> "0..*" CourseAssignment : enseigne
    User "1" --> "0..1" Class : titulaire de
    Class "1" --> "0..*" Student : contient
    Class "1" --> "0..*" Deliberation : fait lobjet de
    Student "1" --> "0..*" Grade : obtient
    Subject "1" --> "0..*" Grade : evalue via
    Subject "1" --> "0..*" CourseAssignment : enseigne dans
    Class "1" --> "0..*" Archive : archivee dans
    User "1" --> "0..*" Message : envoie
`;

export default function DiagramClasses() {
  return <DiagramPage title="Diagramme de classes — Modele du Domaine Complet" subtitle="Toutes les entites et leurs relations" diagram={D} />;
}
