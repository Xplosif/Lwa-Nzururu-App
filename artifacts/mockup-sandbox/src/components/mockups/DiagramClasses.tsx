import { useEffect, useRef } from "react";

const DIAGRAM = `
classDiagram
    class User {
        +int id
        +string username
        +string passwordHash
        +string fullName
        +string role
        +boolean isFirstLogin
        +string tempUsername
        +string tempPassword
        +login()
        +changePassword()
    }
    class Student {
        +int id
        +string registrationNumber
        +string lastName
        +string firstName
        +string gender
        +string phoneNumber
        +string academicYear
        +int classId
        +enroll()
        +getBulletin()
    }
    class Class {
        +int id
        +string name
        +string level
        +string academicYear
        +listStudents()
        +getTitulaire()
    }
    class Subject {
        +int id
        +string name
        +int maxPoints
        +int coefficient
    }
    class Grade {
        +int id
        +int studentId
        +int subjectId
        +string period
        +real value
        +recordGrade()
    }
    class CourseAssignment {
        +int id
        +int titulaireId
        +int classId
        +int subjectId
        +string academicYear
    }
    class Archive {
        +int id
        +string academicYear
        +json data
        +archiveYear()
    }
    class Settings {
        +int id
        +string schoolName
        +string location
        +string signatureBlock
    }

    User "1" --> "0..*" CourseAssignment : est assigne
    Class "1" --> "0..*" Student : contient
    Class "1" --> "0..*" CourseAssignment : est gere par
    Student "1" --> "0..*" Grade : possede
    Subject "1" --> "0..*" Grade : evalue par
    Subject "1" --> "0..*" CourseAssignment : enseigne dans
`;

export default function DiagramClasses() {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const existing = document.getElementById("mermaid-script");
    if (existing) { initMermaid(); return; }
    const script = document.createElement("script");
    script.id = "mermaid-script";
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
    script.onload = initMermaid;
    document.head.appendChild(script);

    function initMermaid() {
      const m = (window as any).mermaid;
      if (!m || !ref.current) return;
      m.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });
      const id = "mermaid-cl-" + Date.now();
      m.render(id, DIAGRAM).then(({ svg }: { svg: string }) => {
        if (ref.current) ref.current.innerHTML = svg;
      }).catch(console.error);
    }
  }, []);

  return (
    <div style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <div style={{ background: "#1e3a5f", color: "#fff", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Diagramme de classes</h2>
        <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.8 }}>Modele objet — entites et relations</p>
      </div>
      <div style={{ background: "#fff", borderRadius: "8px", padding: "20px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        <pre ref={ref} style={{ margin: 0 }}>Chargement du diagramme...</pre>
      </div>
    </div>
  );
}
