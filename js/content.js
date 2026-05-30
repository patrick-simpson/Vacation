const storyContent = {
  milestones: [
    {
      id: "toronto",
      title: "Chapter 1: The Great Tower",
      lat: 43.6532,
      lng: -79.3832,
      story: "The journey begins in the shadow of the CN Tower. Ahead lies the ancient asphalt river known as Highway 401.",
      trivia: [
        {
          question: "How tall is the CN Tower?",
          options: ["553 meters", "300 meters", "1000 meters"],
          answer: 0,
          fact: "It was the tallest free-standing structure in the world for 32 years."
        },
        {
          question: "What lake sits beside Toronto?",
          options: ["Lake Superior", "Lake Ontario", "Lake Erie"],
          answer: 1,
          fact: "Lake Ontario is the 13th largest lake in the world."
        }
      ]
    },
    {
      id: "pickering",
      title: "Chapter 2: The Wind Spinner",
      lat: 43.8384,
      lng: -79.0890,
      story: "Leaving the city limits, a massive white windmill spins lazily near the water, gathering the invisible power of the wind.",
      trivia: [
        {
          question: "What powers the massive plant next to the Pickering windmill?",
          options: ["Coal", "Nuclear Energy", "Solar"],
          answer: 1,
          fact: "The Pickering Nuclear Generating Station produces about 14 percent of Ontario's electricity."
        }
      ]
    },
    {
      id: "oshawa",
      title: "Chapter 3: The City of Chariots",
      lat: 43.8971,
      lng: -78.8658,
      story: "Rolling past Oshawa, you enter the automotive capital of Canada. Many of the metal chariots on the road were born right here.",
      trivia: [
        {
          question: "What famous animal is on the logo of the Oshawa Generals hockey team?",
          options: ["A Bear", "A General", "A Bulldog"],
          answer: 1,
          fact: "The team is named after General Motors."
        }
      ]
    },
    {
      id: "port_hope",
      title: "Chapter 4: The Radiant River",
      lat: 43.9512,
      lng: -78.3064,
      story: "The road crosses the Ganaraska River. In the autumn, the water turns silver and pink with thousands of swimming fish.",
      trivia: [
        {
          question: "What kind of fish famously jumps up the Ganaraska River?",
          options: ["Salmon", "Sharks", "Goldfish"],
          answer: 0,
          fact: "Thousands of salmon swim upstream here every fall to lay their eggs."
        }
      ]
    },
    {
      id: "colborne",
      title: "Chapter 5: The Giant Apple",
      lat: 44.0011,
      lng: -77.8792,
      story: "A strange and wondrous sight appears on the horizon. A massive, smiling red apple towers over the highway.",
      trivia: [
        {
          question: "What is inside the real Big Apple in Colborne?",
          options: ["A roller coaster", "An observatory", "A swimming pool"],
          answer: 1,
          fact: "You can climb up into the apple, and they bake thousands of pies below."
        }
      ]
    },
    {
      id: "trenton",
      title: "Chapter 6: The Flying Metal Birds",
      lat: 44.0997,
      lng: -77.5798,
      story: "The sky hums with the sound of engines. Massive gray airplanes circle the clouds, protecting the skies of the north.",
      trivia: [
        {
          question: "What is located in Trenton?",
          options: ["Canada's largest Air Force base", "A spaceship launchpad", "A blimp factory"],
          answer: 0,
          fact: "CFB Trenton is the hub for military air transport in Canada."
        }
      ]
    },
    {
      id: "kingston",
      title: "Chapter 7: The Limestone Fortress",
      lat: 44.2312,
      lng: -76.4860,
      story: "The highway brushes past Kingston, a city built of gray stone where the great St. Lawrence River finally begins.",
      trivia: [
        {
          question: "What historic fort protects Kingston?",
          options: ["Fort York", "Fort Henry", "Fort George"],
          answer: 1,
          fact: "Fort Henry was built to protect the naval dockyard from invasion."
        },
        {
          question: "Kingston was the very first capital of Canada. True or False?",
          options: ["True", "False", "No one knows"],
          answer: 0,
          fact: "Kingston was the first capital in 1841 before it moved to Montreal, and then Ottawa."
        }
      ]
    },
    {
      id: "thousand_islands",
      title: "Chapter 8: The River of Castles",
      lat: 44.3296,
      lng: -76.1584,
      story: "The water to the south shatters into countless tiny islands. Some hold tiny cabins, while others hold mysterious stone castles.",
      trivia: [
        {
          question: "How many islands are actually in the Thousand Islands?",
          options: ["Exactly 1000", "About 500", "Over 1800"],
          answer: 2,
          fact: "There are 1,864 islands. An island must stay above water all year and support one living tree to count."
        },
        {
          question: "What famous salad dressing was named after this area?",
          options: ["Ranch", "Thousand Island", "Vinaigrette"],
          answer: 1,
          fact: "Legend says the dressing was created on a steam yacht cruising through these very islands."
        }
      ]
    },
    {
      id: "brockville",
      title: "Chapter 9: The Dark Tunnel",
      lat: 44.5896,
      lng: -75.6855,
      story: "Deep beneath the ground near the river lies Canada's oldest railway tunnel, echoing with the ghosts of ancient steam trains.",
      trivia: [
        {
          question: "How old is the Brockville Railway Tunnel?",
          options: ["Built in the 1860s", "Built in the 1950s", "Built in 2010"],
          answer: 0,
          fact: "It opened in 1860, before Canada was even officially a country."
        }
      ]
    },
    {
      id: "upper_canada_village",
      title: "Chapter 10: The Time Machine",
      lat: 44.9058,
      lng: -75.1878,
      story: "You pass a place where time stands still. The people here still bake bread over fires and ride in wooden wagons.",
      trivia: [
        {
          question: "Upper Canada Village shows life from what year?",
          options: ["1866", "1999", "1700"],
          answer: 0,
          fact: "The village is a living history museum showing exactly what life was like in 1866."
        }
      ]
    },
    {
      id: "montreal",
      title: "Chapter 11: The Royal Mountain",
      lat: 45.5017,
      lng: -73.5673,
      story: "The signs change to French, the bridges rise high over the water, and the great Mount Royal welcomes you to the end of the quest.",
      trivia: [
        {
          question: "What does the word Montreal mean?",
          options: ["Many Rivers", "Mount Royal", "Beautiful City"],
          answer: 1,
          fact: "The city surrounds Mount Royal, a large hill right in the center."
        },
        {
          question: "What famous underground network is in Montreal?",
          options: ["Underground City (RESO)", "Lava tubes", "A secret highway"],
          answer: 0,
          fact: "Montreal has over 32 kilometers of underground tunnels connecting malls and train stations to escape the winter cold."
        }
      ]
    }
  ]
};
