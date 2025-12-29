import Link from "next/link";

const footerLinks = {
  company: [
    { name: "About", href: "/about" },
    { name: "AD", href: "/advertise" },
    { name: "Contact", href: "/contact" },
  ],
  sections: [
    { name: "NEWS", href: "/news" },
    { name: "POLICY", href: "/policy" },
    { name: "TOUR", href: "/tour" },
  ],
  legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="hq-footer">
      <div className="container-hq">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="hq-footer-logo">KOREANEWS</div>
            <div className="hq-footer-info">
              <p>Registration: Gwangju City</p>
              <p>Publisher: XXX</p>
              <p>Email: news@koreanewskorea.com</p>
              <p>Tel: 062-XXX-XXXX</p>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">COMPANY</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hq-footer-link">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Section Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">SECTIONS</h3>
            <ul className="space-y-2">
              {footerLinks.sections.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hq-footer-link">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">LEGAL</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hq-footer-link">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="hq-footer-copyright">
          <p>&copy; {new Date().getFullYear()} KOREANEWS. All Rights Reserved.</p>
          <p className="mt-2">koreanewskorea.com - All of Korea, All the News</p>
        </div>
      </div>
    </footer>
  );
}
