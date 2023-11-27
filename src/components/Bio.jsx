import React from "react";
import "./Styles.css";

const Bio = () => {
  const bioData = {
    name: "John Doe",
    title: "Web Developer",
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    imageUrl: "/path-to-image.jpg", // Add your image URL here
    socialLinks: {
      linkedin: "#",
      github: "#",
      // Add other social links if needed
    },
  };

  return (
    <div className="bio-container">
      <div className="stack drop-in" style={{ "--stacks": 3 }}>
        <span style={{ "--index": 0 }}>PERSONAL INFO</span>
        <span className="bio-back">PERSONAL INFO</span>
        <span style={{ "--index": 1 }}>PERSONAL INFO</span>
        <span style={{ "--index": 2 }}>PERSONAL INFO</span>
      </div>
      <img
        src={process.env.PUBLIC_URL + "/nick-bio.jpg"}
        alt="Profile"
        className="bio-image drop-in"
      />
      <p className="drop-in-2">
        Intertwining classic Country melodies with the intimate familiarity and
        euphonic vocals of Rock and Americana, Nickola Magnolia sings songs of
        change, death, heartbreak, hope and belonging from the shores of the
        Great Lakes. Her debut record “Broken Lonesome,” was released in 2022,
        with reviewers noting Magnolia’s “stunning vocal performance, soulful
        passionate vocals,” and her “thoughtful intimate songwriting.” Notable
        performances include opening for Chris Janson, Keith Urban, Jack White,
        City and Colour, and Ben Harper at the Corona Stage in Toronto. She
        performs regularly in her hometown of Port Hope, and has graced festival
        stages throughout Ontario. Reviewers describe her performances as
        “vulnerable yet independent, sobering yet intoxicating, personal yet
        universal” and “singularly powerful.” With storytelling of Townes Van
        Zandt, production like Linda Perry, and a Dolly Parton-esque voice,
        Nickola has crafted a unique sound reflective of her life experiences.
        Her new single ‘Hit and Run’ is a catchy honky-tonk about a
        no-strings-attached good time. Passionate vocals carry the listener
        through an edgy and magnetic performance, with top notch production and
        ear worm hooks engaging the audience from start to finish. Her tireless
        musicianship, exceptional live performances, and transcendent vocals
        make Nickola Magnolia an artist to watch.
      </p>
    </div>
  );
};

export default Bio;
