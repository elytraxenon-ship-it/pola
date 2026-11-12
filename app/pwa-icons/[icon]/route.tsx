import { ImageResponse } from "next/og";

const icons = {
  "apple.png": { size: 180, stripeHeight: 33.33 },
  "192.png": { size: 192, stripeHeight: 33.33 },
  "512.png": { size: 512, stripeHeight: 33.33 },
  "maskable.png": { size: 512, stripeHeight: 27 },
} as const;

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(icons).map((icon) => ({ icon }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ icon: string }> }) {
  const { icon } = await params;
  if (!Object.hasOwn(icons, icon)) return new Response(null, { status: 404 });
  const { size, stripeHeight } = icons[icon as keyof typeof icons];

  return new ImageResponse(
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#fff" />
      <rect width="100" height={stripeHeight} fill="#ed1c24" />
      <rect y={100 - stripeHeight} width="100" height={stripeHeight} fill="#278e43" />
      <g fill="#f8c300" transform="translate(50 50)">
        {Array.from({ length: 21 }, (_, ray) => (
          <path key={ray} d="M0 -21.5 2.9 -7.7 -2.9 -7.7Z" transform={`rotate(${ray * 360 / 21})`} />
        ))}
        <circle r="8.6" />
      </g>
    </svg>,
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
