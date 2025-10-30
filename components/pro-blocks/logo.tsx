import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ width = 320, height = 320, className }) => {
  return (
    <Image
      src="/logo.png"
      alt="Compañía de Alfajores"
      width={width}
      height={height}
      className={className ?? "h-20 w-auto md:h-24 lg:h-28"}
      priority
    />
  );
};
