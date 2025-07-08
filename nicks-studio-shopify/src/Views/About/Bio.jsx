import React from "react";
import { Parallax } from "react-scroll-parallax";
import SEOHelmet from "../../components/SEO/SEOHelmet";
import { PersonSchema, BreadcrumbSchema } from "../../components/SEO/StructuredData";
import "./Bio.css";

const Bio = () => {
  return (
    <>
      <SEOHelmet 
        title="About Nickola Magnolia | Country & Americana Artist Biography"
        description="Learn about Nickola Magnolia, a Country & Americana artist from the Great Lakes region. Read her story, musical journey, and notable performances including opening for Chris Janson and Keith Whitley."
        keywords="Nickola Magnolia biography, country artist bio, americana musician, great lakes artist, broken lonesome album, chris janson opener"
        url={window.location.href}
        type="profile"
      />
      <PersonSchema 
        name="Nickola Magnolia"
        description="Country & Americana musician from the Great Lakes region, known for her debut record 'Broken Lonesome' released in 2022, featuring stunning vocal performances and thoughtful intimate songwriting"
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
          <img
            src={process.env.PUBLIC_URL + "/nick-bio.jpg"}
            alt="Profile"
            className="bio-image drop-in"
          />
        </Parallax>
        <span>
          <Parallax speed={-2}>
            <p className="drop-in-2">
              Intertwining classic Country melodies with the intimate
              familiarity and euphonic vocals of Rock and Americana,{" "}
              <b>Nickola Magnolia</b> sings songs of change, death, heartbreak,
              hope and belonging from the shores of the Great Lakes. Her debut
              record <i>“Broken Lonesome,”</i> was released in 2022, with
              reviewers noting Magnolia’s{" "}
              <i>“stunning vocal performance, soulful passionate vocals,”</i>{" "}
              and her <i>“thoughtful intimate songwriting.”</i>
            </p>
            <p>
              {" "}
              Notable performances include opening for Chris Janson, Keith
              Urban, Jack White, City and Colour, and Ben Harper at the Corona
              Stage in Toronto. She performs regularly in her hometown of Port
              Hope, and has graced festival stages throughout Ontario. Reviewers
              describe her performances as{" "}
              <i>
                “vulnerable yet independent, sobering yet intoxicating, personal
                yet universal”
              </i>{" "}
              and <i>“singularly powerful.”</i>
            </p>

            <p>
              With storytelling of Townes Van Zandt, production like Linda
              Perry, and a Dolly Parton-esque voice, Nickola has crafted a
              unique sound reflective of her life experiences. Her new single{" "}
              <i>‘Hit and Run’</i> is a catchy honky-tonk about a
              no-strings-attached good time. Passionate vocals carry the
              listener through an edgy and magnetic performance, with top notch
              production and ear worm hooks engaging the audience from start to
              finish. Her tireless musicianship, exceptional live performances,
              and transcendent vocals make Nickola Magnolia an artist to watch.
            </p>
          </Parallax>
        </span>
      </div>
    </div>
    </>
  );
};

export default Bio;
