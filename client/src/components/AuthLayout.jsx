import React from "react";

export default function AuthLayout({
    children,
    title,
    subtitle,
    footer,
}) {

    return (
        <div className="
            min-h-screen
            bg-background
            flex
            items-center
            justify-center
            px-4
        ">

            <div className="
                w-full
                max-w-md
            ">

                {/* Logo */}
                <div className="
                    flex
                    justify-center
                    mb-6
                ">
                    <div className="
                        w-16
                        h-16
                        rounded-2xl
                        bg-blue-600
                        flex
                        items-center
                        justify-center
                        shadow-lg
                    ">
                        <span className="
                            text-white
                            text-3xl
                            font-bold
                        ">
                            P
                        </span>
                    </div>
                </div>


                {/* Heading */}
                <div className="
                    text-center
                    mb-8
                ">

                    <h1 className="
                        text-3xl
                        font-heading
                        font-bold
                        text-foreground
                    ">
                        {title}
                    </h1>


                    <p className="
                        mt-2
                        text-sm
                        text-muted-foreground
                    ">
                        {subtitle}
                    </p>

                </div>


                {/* Card */}
                <div className="
                    bg-card
                    border
                    border-border
                    rounded-2xl
                    shadow-xl
                    p-8
                ">

                    {children}

                </div>


                {/* Footer */}
                {footer && (
                    <div className="
                        mt-6
                        text-center
                        text-sm
                        text-muted-foreground
                    ">
                        {footer}
                    </div>
                )}

            </div>

        </div>
    );
}