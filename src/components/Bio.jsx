import React from "react";
import { Parallax } from "react-scroll-parallax";
import "./Styles.css";

const Bio = () => {
  return (
    <Parallax speed={10}>
      <div className="bio-container">
        <Parallax speed={5}>
          <div className="stack drop-in bio-stack" style={{ "--stacks": 3 }}>
            <span style={{ "--index": 0 }}>PERSONAL INFO</span>
            <span className="bio-back">PERSONAL INFO</span>
            <span style={{ "--index": 1 }}>PERSONAL INFO</span>
            <span style={{ "--index": 2 }}>PERSONAL INFO</span>
          </div>
        </Parallax>
        <div className="bio-main">
          <Parallax speed={-5}>
            <img
              src={process.env.PUBLIC_URL + "/nick-bio.jpg"}
              alt="Profile"
              className="bio-image drop-in"
            />
          </Parallax>
          <span>
            <Parallax speed={5}>
              <p className="drop-in-2">
                Intertwining classic Country melodies with the intimate
                familiarity and euphonic vocals of Rock and Americana,{" "}
                <b>Nickola Magnolia</b> sings songs of change, death,
                heartbreak, hope and belonging from the shores of the Great
                Lakes. Her debut record <i>“Broken Lonesome,”</i> was released
                in 2022, with reviewers noting Magnolia’s{" "}
                <i>“stunning vocal performance, soulful passionate vocals,”</i>{" "}
                and her <i>“thoughtful intimate songwriting.”</i>
              </p>
              <p>
                {" "}
                Notable performances include opening for Chris Janson, Keith
                Urban, Jack White, City and Colour, and Ben Harper at the Corona
                Stage in Toronto. She performs regularly in her hometown of Port
                Hope, and has graced festival stages throughout Ontario.
                Reviewers describe her performances as{" "}
                <i>
                  “vulnerable yet independent, sobering yet intoxicating,
                  personal yet universal”
                </i>{" "}
                and <i>“singularly powerful.”</i>
              </p>

              <p>
                With storytelling of Townes Van Zandt, production like Linda
                Perry, and a Dolly Parton-esque voice, Nickola has crafted a
                unique sound reflective of her life experiences. Her new single{" "}
                <i>‘Hit and Run’</i> is a catchy honky-tonk about a
                no-strings-attached good time. Passionate vocals carry the
                listener through an edgy and magnetic performance, with top
                notch production and ear worm hooks engaging the audience from
                start to finish. Her tireless musicianship, exceptional live
                performances, and transcendent vocals make Nickola Magnolia an
                artist to watch.
              </p>
            </Parallax>
          </span>
        </div>
      </div>
    </Parallax>
  );
};

export default Bio;
