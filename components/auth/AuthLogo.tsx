import Image from "next/image";

export function AuthLogo() {
  return (
    <Image
      src="/branding/logo-light.png"
      alt="Z Cards"
      width={220}
      height={70}
      priority
      style={{
        width: "220px",
        height: "auto",
        maxWidth: "100%",
      }}
    />
  );
}

export default AuthLogo;
