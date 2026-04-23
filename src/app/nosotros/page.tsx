import { Card, CardContent } from "@/components/ui/card";
import { Heart, Gift, Sparkles } from "lucide-react";
import Image from "next/image";

export default function NosotrosPage() {
    return (
        <div className="min-h-screen py-16 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                        Nuestra Historia
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-primary">
                        <Heart className="h-6 w-6" />
                        <p className="text-xl font-medium">C&C; Regalos</p>
                        <Heart className="h-6 w-6" />
                    </div>
                </div>

                {/* Main Content */}
                <Card className="mb-8">
                    <CardContent className="p-8 md:p-12 space-y-6 text-neutral-700 leading-relaxed">
                        <p className="text-lg italic text-center text-foreground font-medium">
                            "Un regalo no es solo un objeto... es una forma de decir te pienso, te
                            valoro, estoy aquí para ti."
                        </p>

                        <p>
                            Somos <strong>Catalina y César</strong>, y armamos este emprendimiento con una idea
                            simple: crear regalos personalizados que realmente emocionen, con terminaciones
                            lindas y hechas con dedicación.
                        </p>

                        <p>
                            Y si... partimos con un solo llavero. Ese primer pedido fue el empujón que
                            necesitábamos para atrevernos a crear más, mejorar cada detalle y transformar
                            esto en lo que somos hoy.
                        </p>

                        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 rounded-lg my-8">
                            <p className="text-center font-medium text-foreground mb-4 flex items-center justify-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Hoy diseñamos y preparamos con mucho cariño:
                            </p>
                            <ul className="space-y-2 text-neutral-700">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>Boxes de regalo listas para sorprender</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>Agendas, planners, libretas y papelería personalizada</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>Tazones y vasos sublimados</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>
                                        Tumblers y detalles en resina (nuestros favoritos por lo únicos que quedan)
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>Accesorios personalizados que se convierten en recuerdos</span>
                                </li>
                            </ul>
                        </div>

                        <p>
                            Cada pedido lo hacemos <strong>como si fuera para alguien nuestro</strong>:
                            cuidando el diseño, la presentación y cada mensaje.
                        </p>

                        <div className="text-center pt-6 border-t border-neutral-200">
                            <p className="text-lg font-medium text-foreground mb-2">
                                Gracias por confiar en nuestro trabajo y por elegir regalar con intención.
                            </p>
                            <p className="text-primary font-semibold text-xl">
                                Bienvenidos a C&C; Regalos
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Values Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
                            <h3 className="font-semibold text-foreground mb-2">Hecho con Amor</h3>
                            <p className="text-sm text-neutral-600">
                                Cada detalle pensado para emocionar
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 text-center">
                            <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
                            <h3 className="font-semibold text-foreground mb-2">Personalización</h3>
                            <p className="text-sm text-neutral-600">
                                Regalos únicos que cuentan historias
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 text-center">
                            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                            <h3 className="font-semibold text-foreground mb-2">Calidad Premium</h3>
                            <p className="text-sm text-neutral-600">
                                Terminaciones lindas y cuidadas
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
