import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
import FooterWrapper from "@/components/FooterWrapper";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Enhanced metadata configuration
export const metadata = {
  // Basic metadata
  title: {
    default: "CUTM Result Portal - Academic Results & AOD Portal",
    template: "%s | CUTM Result Portal"
  },
  description: "Official CUTM (Centurion University of Technology and Management) Result Portal for students to check academic results, grades, SGPA, CGPA, and AOD (Academic Office Documentation) services. Secure and reliable academic information system.",
  
  // Keywords for SEO
  keywords: [
    "CUTM result",
    "Centurion University results",
    "academic results",
    "student portal",
    "SGPA calculator",
    "CGPA calculator",
    "university results",
    "AOD portal",
    "academic transcripts",
    "student grades",
    "examination results",
    "academic records"
  ],
  
  // Author and generator
  authors: [{ name: "CUTM Academic Office" }],
  generator: "Next.js",
  
  // Application name
  applicationName: "CUTM Result Portal",
  
  // Referrer policy
  referrer: "origin-when-cross-origin",
  
  // Language and locale
  language: "en-US",
  
  // Metadata base URL (replace with your actual domain)
  metadataBase: new URL("https://cutm-result-portal.vercel.app"),
  
  // Alternate languages (if applicable)
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
      "hi-IN": "/hi-IN"
    }
  },
  
  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "CUTM Result Portal - Academic Results & AOD Portal",
    description: "Official CUTM Result Portal for students to check academic results, grades, SGPA, CGPA, and AOD services. Secure and reliable academic information system.",
    siteName: "CUTM Result Portal",
    images: [
      {
        url: "/og-image.jpg", // Add your Open Graph image
        width: 1200,
        height: 630,
        alt: "CUTM Result Portal - Academic Results Dashboard",
        type: "image/jpeg"
      }
    ]
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "CUTM Result Portal - Academic Results & AOD Portal",
    description: "Official CUTM Result Portal for students to check academic results, grades, SGPA, CGPA, and AOD services.",
    site: "@cutm_official", // Replace with actual Twitter handle
    creator: "@cutm_official",
    images: ["/twitter-image.jpg"] // Add your Twitter card image
  },
  
  // Robots configuration
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  
  // Icons and manifest
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: "/favicon.ico"
  },
  
  // Web app manifest
  manifest: "/manifest.json",
  
  // Theme color
  themeColor: "#000000",
  
  // Color scheme
  colorScheme: "light dark",
  
  // Viewport (handled automatically by Next.js 14+, but can be customized)
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  },
  
  // Verification for search engines
  verification: {
    google: "your-google-verification-code", // Add your Google Search Console verification
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
    other: {
      me: ["your-email@cutm.edu", "https://cutm.edu"]
    }
  },
  
  // Category for app stores
  category: "education",
  
  // Classification
  classification: "Educational Portal",
  
  // Other metadata
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "msapplication-config": "/browserconfig.xml",
    "msapplication-TileColor": "#000000",
    "msapplication-tap-highlight": "no"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-svh flex flex-col">
          <NavbarWrapper />
          <main className="flex-1">
            {children}
            <Analytics />
          </main>
          <FooterWrapper />
        </div>
      </body>
    </html>
  );
}
