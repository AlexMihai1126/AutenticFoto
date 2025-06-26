"use client";

import Link from "next/link";
import { Container } from "react-bootstrap";
import { FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="py-4 text-center mt-auto">
      <Container style={{ fontSize: "0.825rem" }}>
        <Link
          href={"/faq"}
          className="link-offset-2 link-underline link-underline-opacity-0 text-dark"
        >
          <span>Întrebări frecvente</span>
        </Link>
        {" | "}
        &copy; 2025 <strong>AutenticFoto</strong>. Proiect de licență realizat
        de <strong>Alexandru Mihai</strong>. Toate drepturile rezervate.
        {" | "}
        <Link
          href="https://github.com/AlexMihai1126/AutenticFoto"
          target="_blank"
          rel="noopener noreferrer"
          className="link-offset-2 link-underline link-underline-opacity-0 text-dark"
        >
          <FaGithub className="me-1" />
          <span>GitHub</span>
        </Link>
      </Container>
    </footer>
  );
}
