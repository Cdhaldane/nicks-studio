import React from "react";
import { Parallax } from "react-scroll-parallax";
import SEOHelmet from "../../components/SEO/SEOHelmet";
import { PersonSchema, BreadcrumbSchema } from "../../components/SEO/StructuredData";
import ResponsiveImage from "../../components/ResponsiveImage/ResponsiveImage";
import "./Bio.css";

const Bio = () => {
  return (
    <>
      <SEOHelmet 
        title="About Nickola Magnolia | Outlaw Soul & Alt-Country Singer-Songwriter"
        description="Nickola Magnolia is an independent Canadian singer-songwriter from Port Hope, Ontario, blending alt-country, retro soul and rock & roll. Sophomore album Bad Woman; has opened for Keith Urban, Jack White and Chris Janson."
        keywords="Nickola Magnolia biography, outlaw soul, alt-country singer, retro soul, Canadian singer-songwriter, Bad Woman album, broken lonesome album, Calgary Stampede Big Four Roadhouse, chris janson opener, Northumberland County artist, Port Hope musician, Cobourg country artist, Peterborough live music, country music Ontario live"
        url={window.location.href}
        type="profile"
      />
      <PersonSchema 
        name="Nickola Magnolia"
        description="Independent Canadian singer-songwriter blending gritty alt-country, retro soul and rock & roll. Debut album 'Broken Lonesome' (2022); sophomore album 'Bad Woman'."
        image={`${window.location.origin}/nick-bio.jpg`}
        url={window.location.href}
        sameAs={[
          "https://open.spotify.com/artist/5UrVks2tmoQ4BwTvlkQaI4",
          "https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q",
          "https://www.instagram.com/nickolamagnolia"
        ]}
      />
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: window.location.origin },
          { name: "About", url: `${window.location.origin}/about` }
        ]}
      />
      
      <div className="bio-container">
      <div className="bio-main">
        <Parallax speed={5}>
          <ResponsiveImage
            src="nick-bio"
            alt="Nickola Magnolia - Outlaw Soul & Alt-Country Artist"
            className="bio-image drop-in"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
        </Parallax>
        <span>
          <Parallax speed={-2}>
            <p className="drop-in-2">
              <b>Nickola Magnolia</b> is an independent Canadian
              singer-songwriter and live performer blending gritty alt-country,
              retro soul and rock &amp; roll. Her music pairs raw, soulful
              storytelling with the swagger of outlaw country and the energy of
              classic rock. Honest, unapologetic and built for the stage.
            </p>
            <p>
              Her sophomore album, <i>Bad Woman</i>, is a gritty record about
              taking back your story: survival, self-respect and freedom. It
              blends outlaw country soul with retro rock &amp; roll, written for
              the misfits, wild hearts and women who refuse to shrink
              themselves. It follows her 2022 debut <i>Broken Lonesome</i>,
              which reviewers praised for its{" "}
              <i>“stunning vocal performance, soulful passionate vocals”</i>{" "}
              and <i>“thoughtful intimate songwriting.”</i>
            </p>
            <p>
              Her live show moves between intimate honesty and full-stage
              energy: big enough for festivals, honest enough for listening
              rooms. She has opened for Keith Urban, Jack White, Ben Harper,
              City and Colour, Sarah Harmer and Chris Janson, played the Big
              Four Roadhouse at the 2026 Calgary Stampede, and toured 14 dates
              across Italy and the United Kingdom in 2025, with further shows in
              Nashville and Costa Rica. She has headlined stages of up to 1,000
              people and still plays regularly in her hometown of Port Hope,
              Ontario. Reviewers have called her performances{" "}
              <i>
                “vulnerable yet independent, sobering yet intoxicating, personal
                yet universal”
              </i>{" "}
              and <i>“singularly powerful.”</i>
            </p>
          </Parallax>
        </span>
      </div>
    </div>
    </>
  );
};

export default Bio;
