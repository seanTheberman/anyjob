"use client";

import { useEffect } from "react";
import Script from "next/script";

export function GTranslateWidget() {
    useEffect(() => {
        // @ts-ignore
        window.gtranslateSettings = {
            default_language: "en",
            native_language_names: true,
            languages: ["fr", "en", "es", "de", "it", "nl", "pt", "ar"],
            wrapper_selector: ".gtranslate_wrapper",
            flag_style: "3d",
            alt_flags: { en: "usa", pt: "brazil" },
        };
    }, []);

    return (
        <>
            {/* Mobile: smaller and positioned above bottom navbar (80px from bottom to account for 64px navbar + spacing) */}
            {/* Desktop: normal size at bottom-6 right-6 */}
            <div className="gtranslate_wrapper fixed bottom-20 right-3 lg:bottom-6 lg:right-6 z-[100000] scale-75 lg:scale-100 origin-bottom-right"></div>
            <Script
                src="https://cdn.gtranslate.net/widgets/latest/float.js"
                strategy="lazyOnload"
            />
        </>
    );
}
