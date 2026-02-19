/**
 * Fallback word lists for the Hebrew Learning Game
 * Used if the CSV file fails to load
 */

const fallbackWordLists = {
    // Round 1: 2-letter Hebrew words
    round1: [
        { german: "Berg", english: "Mountain", hebrew: "הר" },
        { german: "See", english: "Sea", hebrew: "ים" },
        { german: "Baum", english: "Tree", hebrew: "עץ" },
        { german: "Fisch", english: "Fish", hebrew: "דג" },
        { german: "Hand", english: "Hand", hebrew: "יד" },
        { german: "Fuß", english: "Foot", hebrew: "רגל" },
        { german: "Nase", english: "Nose", hebrew: "אף" },
        { german: "Mund", english: "Mouth", hebrew: "פה" },
        { german: "Tag", english: "Day", hebrew: "יום" },
        { german: "Brot", english: "Bread", hebrew: "לחם" }
    ],
    
    // Round 2: 4-letter Hebrew words
    round2: [
        { german: "Schule", english: "School", hebrew: "ספר" },
        { german: "Lehrer", english: "Teacher", hebrew: "מורה" },
        { german: "Fenster", english: "Window", hebrew: "חלון" },
        { german: "Telefon", english: "Telephone", hebrew: "טלפון" },
        { german: "Computer", english: "Computer", hebrew: "מחשב" },
        { german: "Straße", english: "Street", hebrew: "רחוב" },
        { german: "Stadt", english: "City", hebrew: "עיר" },
        { german: "Freund", english: "Friend", hebrew: "חבר" },
        { german: "Vogel", english: "Bird", hebrew: "ציפור" },
        { german: "Trauben", english: "Grapes", hebrew: "ענבים" }
    ],
    
    // Round 3: 6-letter Hebrew words
    round3: [
        { german: "Schokolade", english: "Chocolate", hebrew: "שוקולד" },
        { german: "Universität", english: "University", hebrew: "אוניברסיטה" },
        { german: "Fernseher", english: "Television", hebrew: "טלוויזיה" },
        { german: "Sonnenaufgang", english: "Sunrise", hebrew: "זריחה" },
        { german: "Sonnenuntergang", english: "Sunset", hebrew: "שקיעה" },
        { german: "Regenschirm", english: "Umbrella", hebrew: "מטרייה" },
        { german: "Fernsehprogramm", english: "TV program", hebrew: "תוכנית" },
        { german: "Kühlschrank", english: "Refrigerator", hebrew: "מקרר" },
        { german: "Klassenzimmer", english: "Classroom", hebrew: "כיתה" },
        { german: "Badezimmer", english: "Bathroom", hebrew: "אמבטיה" }
    ],
    
    // Round 4: 2-word Hebrew phrases
    round4: [
        { german: "Großer Berg", english: "Big mountain", hebrew: "הר גדול" },
        { german: "Kleines Kind", english: "Small child", hebrew: "ילד קטן" },
        { german: "Blaues Wasser", english: "Blue water", hebrew: "מים כחולים" },
        { german: "Kalter Tag", english: "Cold day", hebrew: "יום קר" },
        { german: "Leckeres Brot", english: "Tasty bread", hebrew: "לחם טעים" },
        { german: "Süßer Apfel", english: "Sweet apple", hebrew: "תפוח מתוק" },
        { german: "Altes Haus", english: "Old house", hebrew: "בית ישן" },
        { german: "Neues Buch", english: "New book", hebrew: "ספר חדש" },
        { german: "Schneller Zug", english: "Fast train", hebrew: "רכבת מהירה" },
        { german: "Schöne Blume", english: "Beautiful flower", hebrew: "פרח יפה" }
    ],
    
    // Round 5: 3-word Hebrew sentences
    round5: [
        { german: "Ich liebe Schokolade", english: "I love chocolate", hebrew: "אני אוהב שוקולד" },
        { german: "Das Kind isst", english: "The child eats bread", hebrew: "הילד אוכל לחם" },
        { german: "Die Katze schläft", english: "The cat is sleeping", hebrew: "החתול ישן עכשיו" },
        { german: "Er lernt Hebräisch", english: "He learns Hebrew", hebrew: "הוא לומד עברית" },
        { german: "Sie trinkt Wasser", english: "She drinks water", hebrew: "היא שותה מים" },
        { german: "Wir lesen Bücher", english: "We read books", hebrew: "אנחנו קוראים ספרים" },
        { german: "Die Sonne scheint", english: "The sun shines", hebrew: "השמש זורחת בשמיים" },
        { german: "Der Hund läuft", english: "The dog runs", hebrew: "הכלב רץ מהר" },
        { german: "Ich gehe nach Hause", english: "I am going home", hebrew: "אני הולך הביתה" },
        { german: "Er spielt Klavier", english: "He plays piano", hebrew: "הוא מנגן בפסנתר" }
    ],
    
    // Round 6: 4-word Hebrew sentences
    round6: [
        { german: "Ich gehe in die Schule", english: "I go to school", hebrew: "אני הולך לבית הספר" },
        { german: "Sie liest ein gutes Buch", english: "She reads a good book", hebrew: "היא קוראת ספר טוב" },
        { german: "Wir fahren nach Tel Aviv", english: "We are traveling to Tel Aviv", hebrew: "אנחנו נוסעים לתל אביב" },
        { german: "Der Junge spielt mit Freunden", english: "The boy plays with friends", hebrew: "הילד משחק עם חברים" },
        { german: "Sie isst in der Küche", english: "She eats in the kitchen", hebrew: "היא אוכלת במטבח בבית" },
        { german: "Er kauft frisches Gemüse", english: "He buys fresh vegetables", hebrew: "הוא קונה ירקות טריים" },
        { german: "Die Frau trinkt heißen Tee", english: "The woman drinks hot tea", hebrew: "האישה שותה תה חם" },
        { german: "Das Kind schläft zu Hause", english: "The child sleeps at home", hebrew: "הילד ישן בבית בלילה" },
        { german: "Ich lerne jeden Tag Hebräisch", english: "I learn Hebrew every day", hebrew: "אני לומד עברית היום" },
        { german: "Heute ist es sehr warm", english: "Today it is very warm", hebrew: "היום חם בחוץ עכשיו" }
    ]
};
