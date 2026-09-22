import { NextRequest, NextResponse } from "next/server";

const KURDISH_CITY_MAP: Record<string, string> = {
  erbil: "هەولێر",
  arbil: "هەولێر",
  irbil: "هەولێر",
  hewler: "هەولێر",
  hawler: "هەولێر",
  sulaymaniyah: "سلێمانی",
  sulaimani: "سلێمانی",
  sulaimaniyah: "سلێمانی",
  slemani: "سلێمانی",
  "as sulaymaniyah": "سلێمانی",
  duhok: "دهۆک",
  dohuk: "دهۆک",
  dahuk: "دهۆک",
  kirkuk: "کەرکووک",
  karkuk: "کەرکووک",
  halabja: "هەڵەبجە",
  halabjah: "هەڵەبجە",
  zakho: "زاخۆ",
  zaxo: "زاخۆ",
  soran: "سۆران",
  diana: "سۆران",
  ranya: "ڕانیە",
  rania: "ڕانیە",
  kalar: "کەلار",
  chamchamal: "چەمچەماڵ",
  koya: "کۆیە",
  shaqlawa: "شەقڵاوە",
  rawanduz: "ڕەواندز",
  akre: "عەقرە",
  aqrah: "عەقرە",
  amadiyah: "ئامێدی",
  amadiya: "ئامێدی",
  khanaqin: "خانەقین",
  kifri: "کفری",
  penjwin: "پێنجوێن",
  darbandikhan: "دەربەندیخان",
  bardarash: "بەردەڕەش",
  semel: "سێمێل",
  choman: "چۆمان",
};

const KNOWN_VPN_PROVIDERS = [
  "m247",
  "datacamp",
  "digitalocean",
  "ovh",
  "linode",
  "choopa",
  "vultr",
  "hetzner",
  "leaseweb",
  "nordvpn",
  "expressvpn",
  "surfshark",
  "cyberghost",
  "proton",
  "private internet access",
  "mullvad",
  "cloudflare",
  "fastly",
  "amazon",
  "google cloud",
  "microsoft",
  "tzulo",
  "server",
  "hosting",
  "vpn",
  "proxy",
];

function formatKurdishLocation(cityRaw: string, regionRaw: string): string {
  const combined = `${cityRaw || ""} ${regionRaw || ""}`.toLowerCase();

  for (const [key, kurdishName] of Object.entries(KURDISH_CITY_MAP)) {
    if (combined.includes(key)) {
      return `${kurdishName}، کوردستان`;
    }
  }

  if (cityRaw && cityRaw.trim().length > 0) {
    return `${cityRaw.trim()}، کوردستان`;
  }

  return "هەولێر، کوردستان";
}

function checkVpnStatus(isp: string, org: string, asName: string, proxy?: boolean, hosting?: boolean): boolean {
  if (proxy === true) return true;
  if (hosting === true) return true;

  const combined = `${isp || ""} ${org || ""} ${asName || ""}`.toLowerCase();
  for (const kw of KNOWN_VPN_PROVIDERS) {
    if (combined.includes(kw)) {
      // Exclude Kurdistan local ISPs (e.g. Kurdistan Net, Fastlink, Newroz)
      if (combined.includes("kurdistan") || combined.includes("fastlink") || combined.includes("newroz") || combined.includes("ftth")) {
        continue;
      }
      return true;
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "";
  const isLocal = !realIp || realIp === "127.0.0.1" || realIp === "::1" || realIp.startsWith("192.168.");

  // 1. Query ip-api with full proxy and hosting detection
  const ipApiUrl = isLocal
    ? "http://ip-api.com/json/?fields=status,country,regionName,city,isp,org,as,proxy,hosting,query"
    : `http://ip-api.com/json/${realIp}?fields=status,country,regionName,city,isp,org,as,proxy,hosting,query`;

  try {
    const res = await fetch(ipApiUrl, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === "success") {
        const isVpn = checkVpnStatus(data.isp, data.org, data.as, data.proxy, data.hosting);
        const formatted = formatKurdishLocation(data.city, data.regionName);

        return NextResponse.json({
          location: formatted,
          city: data.city,
          country: data.country,
          isVpn,
          ip: data.query,
        });
      }
    }
  } catch (err) {
    console.error("ip-api query failed, trying ipwho.is:", err);
  }

  // 2. Fallback to ipwho.is
  try {
    const ipWhoUrl = isLocal ? "https://ipwho.is/" : `https://ipwho.is/${realIp}`;
    const res2 = await fetch(ipWhoUrl, { cache: "no-store" });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2 && (data2.city || data2.region)) {
        const isVpn = checkVpnStatus(
          data2.connection?.isp,
          data2.connection?.org,
          data2.connection?.asn ? String(data2.connection.asn) : ""
        );
        const formatted = formatKurdishLocation(data2.city, data2.region);

        return NextResponse.json({
          location: formatted,
          city: data2.city,
          country: data2.country,
          isVpn,
          ip: data2.ip,
        });
      }
    }
  } catch (err2) {
    console.error("ipwho.is fallback failed:", err2);
  }

  return NextResponse.json({
    location: "هەولێر، کوردستان",
    city: "Erbil",
    country: "Kurdistan",
    isVpn: false,
  });
}
