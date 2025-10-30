import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ width = 160, height = 160, className }) => {
  return (
    <Image
      src="/logo.png"
      alt="Compañía de Alfajores"
      width={width}
      height={height}
      className={className ?? "h-10 w-auto md:h-12 lg:h-14"}
      priority
    />
  );
};
