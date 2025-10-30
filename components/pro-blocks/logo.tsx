import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ width = 135, height = 135, className }) => {
  return (
    <Image
      src="/logo.png"
      alt="Compañía de Alfajores"
      width={width}
      height={height}
      className={className ?? "h-9 w-auto md:h-10"}
      priority
    />
  );
};
