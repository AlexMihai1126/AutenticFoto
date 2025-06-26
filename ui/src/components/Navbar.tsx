"use client";

import {
  Navbar,
  Nav,
  Button,
  Container,
  NavDropdown,
  Alert,
  Placeholder,
  ButtonGroup,
} from "react-bootstrap";
import { useRouter } from "next/navigation";

import { useUser } from "@/contexts/UserContext";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletMismatch } from "@/hooks/useWalletMismatch";
import { useSessionChecker } from "@/hooks/useSessionChecker";

export default function AppNavbar() {
  const router = useRouter();

  const { user, loading } = useUser();
  const { account, connect } = useWallet();
  const walletMismatch = useWalletMismatch();

  useSessionChecker();

  const needsBlockchainConfirm = !!user && !user.walletAddress;

  const metamaskButtonLabel = account
    ? `${account.slice(0, 6)}…${account.slice(-4)}`
    : "Conectează Metamask";

  return (
    <>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand onClick={() => router.push("/")}>
            AutenticFoto
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="me-auto">
              <Nav.Link onClick={() => router.push("/photos")}>
                Fotografii
              </Nav.Link>
            </Nav>

            <Nav className="ms-auto align-items-center">
              {loading && (
                <>
                  <Placeholder as={Nav.Link} animation="glow" className="me-2">
                    <Placeholder xs={4} />
                  </Placeholder>
                  <Placeholder as={Nav.Link} animation="glow">
                    <Placeholder xs={4} />
                  </Placeholder>
                </>
              )}

              {!loading && !user && (
                <>
                  <Nav.Link onClick={() => router.push("/login")}>
                    Conectare
                  </Nav.Link>
                  <Nav.Link onClick={() => router.push("/register")}>
                    Înregistrare
                  </Nav.Link>
                </>
              )}

              {!loading && user && (
                <>
                  <NavDropdown title={`Salut, ${user.username}`} align="end">
                    <NavDropdown.Item onClick={() => router.push("/myaccount")}>
                      Contul meu
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={() => router.push("/logout")}>
                      Deconectare
                    </NavDropdown.Item>
                  </NavDropdown>

                  <Button
                    variant={
                      walletMismatch.isMismatch
                        ? "outline-danger"
                        : "outline-secondary"
                    }
                    className="ms-3 border-0"
                    onClick={() => {
                      if (!account) connect();
                    }}
                    disabled={!!account}
                  >
                    {metamaskButtonLabel}
                  </Button>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {walletMismatch.isMismatch && (
        <Alert variant="danger" className="text-center m-0">
          EROARE: Portofelul MetaMask conectat NU coincide cu cel asociat
          contului!
           <Button
              variant="outline-secondary"
              size="sm"
              className="mx-4"
              onClick={() => router.push("/faq")}
            >
              Mai multe
            </Button>
        </Alert>
      )}

      {!loading && needsBlockchainConfirm && (
        <Alert variant="warning" className="text-center m-0">
          ATENȚIE: Portofelul electronic nu este confirmat. Multe
          funcționalități sunt indisponibile.
          <ButtonGroup className="px-4">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => router.push("/myaccount/confirm-wallet")}
            >
              Confirmă wallet
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => router.push("/faq")}
            >
              Mai multe
            </Button>
          </ButtonGroup>
        </Alert>
      )}
    </>
  );
}
