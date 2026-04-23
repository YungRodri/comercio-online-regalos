import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const footerLinks = {
  productos: [
    { name: "Boxes de Regalos", href: "/products?category=boxes" },
    { name: "Papelería", href: "/products?category=papeleria" },
    { name: "Desayunos", href: "/products?category=desayunos" },
    { name: "Joyería", href: "/products?category=joyeria" },
    { name: "Tazones", href: "/products?category=tazones" },
  ],
  empresa: [
    { name: "Sobre Nosotros", href: "/about" },
    { name: "Contacto", href: "/contact" },
    { name: "Blog", href: "/blog" },
    { name: "Trabaja con Nosotros", href: "/careers" },
  ],
  ayuda: [
    { name: "Centro de Ayuda", href: "/help" },
    { name: "Envios y Entregas", href: "/shipping" },
    { name: "Devoluciones", href: "/returns" },
    { name: "Garantia", href: "/warranty" },
    { name: "Preguntas Frecuentes", href: "/faq" },
  ],
  legal: [
    { name: "Terminos y Condiciones", href: "/terms" },
    { name: "Politica de Privacidad", href: "/privacy" },
    { name: "Cookies", href: "/cookies" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-10 w-10">
                <img src="/logo.png" alt="cycregalos logo" className="object-contain w-full h-full" />
              </div>
              <span className="text-xl font-bold tracking-tight">cycregalos</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Regalos con intención. Encuentra el regalo perfecto para esa persona especial.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold">Productos</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.productos.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold">Empresa</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-semibold">Ayuda</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.ayuda.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold">Contacto</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Santiago, Chile</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+56 9 1234 5678</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>hola@cycregalos.cl</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Cyc Regalos. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
