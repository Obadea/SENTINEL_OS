/** SENTINEL_OS palette mapped to Clerk v7 appearance variables */
const variables = {
  colorPrimary: "#a1d800",
  colorPrimaryForeground: "#000000",
  colorForeground: "#e5e2e1",
  colorMutedForeground: "#8d9479",
  colorBackground: "#050505",
  colorInput: "#0a0a0a",
  colorInputForeground: "#ffffff",
  colorNeutral: "#2a2a2a",
  colorMuted: "#1c1b1b",
  colorBorder: "rgba(255, 255, 255, 0.12)",
  colorRing: "#a1d800",
  colorModalBackdrop: "rgba(0, 0, 0, 0.88)",
  colorDanger: "#ffb4ab",
  colorSuccess: "#b8f600",
  colorWarning: "#febc2e",
  borderRadius: "0px",
  fontFamily: "var(--font-jetbrains-mono)",
  fontFamilyButtons: "var(--font-jetbrains-mono)",
} as const

const elements = {
  rootBox: "[color-scheme:dark]",
  card: "bg-[#050505] border border-white/10 shadow-none rounded-none text-[#e5e2e1]",
  modalContent: "bg-[#050505] text-[#e5e2e1]",
  modalBackdrop: "bg-black/88",
  headerTitle: {
    color: "#a1d800",
    fontFamily: "var(--font-jetbrains-mono)",
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: "0.04em",
  },
  headerSubtitle: {
    color: "#8d9479",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  dividerLine: "bg-white/10",
  dividerText: {
    color: "#8d9479",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  socialButtonsBlockButton: {
    color: "#e5e2e1",
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "0",
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      color: "#e5e2e1",
    },
  },
  socialButtonsBlockButtonText: {
    color: "#e5e2e1",
    fontFamily: "var(--font-jetbrains-mono)",
    textTransform: "uppercase",
    fontSize: "10px",
    letterSpacing: "0.15em",
  },
  formButtonPrimary: {
    backgroundColor: "#a1d800",
    color: "#000000",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    borderRadius: "0",
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "rgba(161, 216, 0, 0.9)",
      color: "#000000",
    },
  },
  formFieldLabel: {
    color: "#8d9479",
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontWeight: "700",
  },
  formFieldInput: {
    color: "#ffffff",
    backgroundColor: "#0a0a0a",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "0",
    "&:focus": {
      borderColor: "#a1d800",
      boxShadow: "none",
    },
  },
  formFieldInputShowPasswordButton: {
    color: "#8d9479",
    "&:hover": { color: "#a1d800" },
  },
  footerActionText: { color: "#8d9479" },
  footerActionLink: {
    color: "#a1d800",
    fontWeight: "700",
    "&:hover": { color: "#b8f600" },
  },
  identityPreviewText: { color: "#a1d800" },
  identityPreviewEditButton: { color: "#a1d800" },
  formFieldAction: { color: "#a1d800" },
  alternativeMethodsBlockButton: {
    color: "#e5e2e1",
    "&:hover": { color: "#a1d800" },
  },
  otpCodeFieldInput: {
    color: "#ffffff",
    backgroundColor: "#0a0a0a",
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  formResendCodeLink: { color: "#a1d800" },
  navbar: "bg-[#0a0a0a] border-r border-white/10",
  navbarTitle: {
    color: "#a1d800 !important",
    fontFamily: "var(--font-jetbrains-mono)",
    textTransform: "uppercase",
    fontWeight: "bold",
    letterSpacing: "0.05em",
  },
  navbarSectionTitle: {
    color: "#a1d800 !important",
    fontFamily: "var(--font-jetbrains-mono)",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  profileSectionTitle: { color: "#a1d800 !important" },
  profilePageTitle: { color: "#a1d800 !important" },
  navbarSubtitle: { color: "#e5e2e1 !important", fontSize: "11px" },
  navbarSectionSubtitle: { color: "#e5e2e1 !important", fontSize: "11px" },
  profileSectionSubtitle: { color: "#e5e2e1 !important" },
  profilePageSubtitle: { color: "#e5e2e1 !important" },
  navbarButton: "text-[#e5e2e1] hover:text-[#a1d800] transition-colors",
  navbarButtonText: {
    color: "#e5e2e1 !important",
    fontFamily: "var(--font-jetbrains-mono)",
    textTransform: "uppercase",
    fontSize: "10px",
  },
  identityPreviewEditButtonIcon: { color: "#a1d800" },
  userButtonPopoverCard:
    "bg-[#050505] border border-white/10 shadow-none rounded-none",
  userButtonPopoverActionButton: {
    color: "#e5e2e1 !important",
    "&:hover": {
      color: "#a1d800 !important",
      backgroundColor: "rgba(161, 216, 0, 0.05) !important",
    },
  },
  userButtonPopoverActionButtonText: {
    color: "#e5e2e1 !important",
    fontFamily: "var(--font-jetbrains-mono)",
    textTransform: "uppercase",
    fontSize: "10px",
    letterSpacing: "0.1em",
  },
  userButtonPopoverActionButtonIcon: { color: "#a1d800" },
  userPreviewMainIdentifier: {
    color: "#e5e2e1 !important",
    fontWeight: "bold",
  },
  userPreviewSecondaryIdentifier: {
    color: "#8d9479 !important",
    fontSize: "10px",
  },
  userButtonPopoverActionButton__manageAccount: {
    color: "#e5e2e1 !important",
  },
  userButtonPopoverActionButton__signOut: {
    color: "#e5e2e1 !important",
  },
  footer: {
    color: "#8d9479",
    opacity: "0.85",
    fontSize: "9px",
    fontFamily: "var(--font-jetbrains-mono)",
    textTransform: "uppercase",
  },
}

const modalAppearance = { variables, elements }

/** Shared Clerk appearance for Provider, sign-in, and sign-up modals */
export const clerkAppearance = {
  variables,
  elements,
  signIn: modalAppearance,
  signUp: modalAppearance,
}
