// Structured data schemas for SEO

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nile Flow Africa",
  url: "https://nileflowafrica.com",
  logo: "https://nileflowafrica.com/images/logo.png",
  description:
    "Premium African E-commerce Marketplace offering authentic handcrafted products from across Africa. Connecting global customers with talented African artisans and unique cultural treasures.",
  founder: {
    "@type": "Person",
    name: "Anthony Wai",
    jobTitle: "Founder & CEO",
  },
  sameAs: ["https://www.linkedin.com/in/anthony-wai-a4bb5a348"],
  address: {
    "@type": "PostalAddress",
    addressCountry: "Africa",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Service",
    availableLanguage: ["English", "French", "Swahili"],
  },
};

export const FOUNDER_PERSON_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Anthony Wai",
  jobTitle: "Founder & CEO of Nile Flow Africa",
  worksFor: {
    "@type": "Organization",
    name: "Nile Flow Africa",
    url: "https://nileflowafrica.com",
  },
  url: "https://nileflowafrica.com/about",
  sameAs: ["https://www.linkedin.com/in/anthony-wai-a4bb5a348"],
  description:
    "Visionary entrepreneur dedicated to connecting global markets with authentic African craftsmanship and culture.",
  knowsAbout: [
    "E-commerce",
    "African Markets",
    "Cultural Heritage",
    "Sustainable Business",
  ],
};
