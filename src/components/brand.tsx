import logoAsset from "@/assets/nipun-logo.png.asset.json";

export function NipunLogo({ className = "h-9 w-auto" }: { className?: string }) {
  return <img src={logoAsset.url} alt="Nipun" className={className} loading="eager" decoding="async" />;
}

export const BRAND = {
  name: "Nipun",
  tagline: "Cybersecurity Awareness Training",
  shortTagline: "Impacting Lives",
};
