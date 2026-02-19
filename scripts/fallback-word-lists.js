/**
 * Fallback word lists for the Hebrew Learning Game
 * Used if the CSV file fails to load
 */

const fallbackWordLists = {
    // Round 1: 2-letter Hebrew words
    round1: [
        { german: "Berg", hebrew: "הר" },
        { german: "See", hebrew: "ים" },
        { german: "Baum", hebrew: "עץ" },
        { german: "Fisch", hebrew: "דג" },
        { german: "Hand", hebrew: "יד" },
        { german: "Fuß", hebrew: "רגל" },
        { german: "Nase", hebrew: "אף" },
        { german: "Mund", hebrew: "פה" },
        { german: "Tag", hebrew: "יום" },
        { german: "Brot", hebrew: "לחם" }
    ],
    
    // Round 2: 4-letter Hebrew words
    round2: [
        { german: "Schule", hebrew: "ספר" },
        { german: "Lehrer", hebrew: "מורה" },
        { german: "Fenster", hebrew: "חלון" },
        { german: "Telefon", hebrew: "טלפון" },
        { german: "Computer", hebrew: "מחשב" },
        { german: "Straße", hebrew: "רחוב" },
        { german: "Stadt", hebrew: "עיר" },
        { german: "Freund", hebrew: "חבר" },
        { german: "Vogel", hebrew: "ציפור" },
        { german: "Trauben", hebrew: "ענבים" }
    ],
    
    // Round 3: 6-letter Hebrew words
    round3: [
        { german: "Schokolade", hebrew: "שוקולד" },
        { german: "Universität", hebrew: "אוניברסיטה" },
        { german: "Fernseher", hebrew: "טלוויזיה" },
        { german: "Sonnenaufgang", hebrew: "זריחה" },
        { german: "Sonnenuntergang", hebrew: "שקיעה" },
        { german: "Regenschirm", hebrew: "מטרייה" },
        { german: "Fernsehprogramm", hebrew: "תוכנית" },
        { german: "Kühlschrank", hebrew: "מקרר" },
        { german: "Klassenzimmer", hebrew: "כיתה" },
        { german: "Badezimmer", hebrew: "אמבטיה" }
    ],
    
    // Round 4: 2-word Hebrew phrases
    round4: [
        { german: "Großer Berg", hebrew: "הר גדול" },
        { german: "Kleines Kind", hebrew: "ילד קטן" },
        { german: "Blaues Wasser", hebrew: "מים כחולים" },
        { german: "Kalter Tag", hebrew: "יום קר" },
        { german: "Leckeres Brot", hebrew: "לחם טעים" },
        { german: "Süßer Apfel", hebrew: "תפוח מתוק" },
        { german: "Altes Haus", hebrew: "בית ישן" },
        { german: "Neues Buch", hebrew: "ספר חדש" },
        { german: "Schneller Zug", hebrew: "רכבת מהירה" },
        { german: "Schöne Blume", hebrew: "פרח יפה" }
    ],
    
    // Round 5: 3-word Hebrew sentences
    round5: [
        { german: "Ich liebe Schokolade", hebrew: "אני אוהב שוקולד" },
        { german: "Das Kind isst", hebrew: "הילד אוכל לחם" },
        { german: "Die Katze schläft", hebrew: "החתול ישן עכשיו" },
        { german: "Er lernt Hebräisch", hebrew: "הוא לומד עברית" },
        { german: "Sie trinkt Wasser", hebrew: "היא שותה מים" },
        { german: "Wir lesen Bücher", hebrew: "אנחנו קוראים ספרים" },
        { german: "Die Sonne scheint", hebrew: "השמש זורחת בשמיים" },
        { german: "Der Hund läuft", hebrew: "הכלב רץ מהר" },
        { german: "Ich gehe nach Hause", hebrew: "אני הולך הביתה" },
        { german: "Er spielt Klavier", hebrew: "הוא מנגן בפסנתר" }
    ],
    
    // Round 6: 4-word Hebrew sentences
    round6: [
        { german: "Ich gehe in die Schule", hebrew: "אני הולך לבית הספר" },
        { german: "Sie liest ein gutes Buch", hebrew: "היא קוראת ספר טוב" },
        { german: "Wir fahren nach Tel Aviv", hebrew: "אנחנו נוסעים לתל אביב" },
        { german: "Der Junge spielt mit Freunden", hebrew: "הילד משחק עם חברים" },
        { german: "Sie isst in der Küche", hebrew: "היא אוכלת במטבח בבית" },
        { german: "Er kauft frisches Gemüse", hebrew: "הוא קונה ירקות טריים" },
        { german: "Die Frau trinkt heißen Tee", hebrew: "האישה שותה תה חם" },
        { german: "Das Kind schläft zu Hause", hebrew: "הילד ישן בבית בלילה" },
        { german: "Ich lerne jeden Tag Hebräisch", hebrew: "אני לומד עברית היום" },
        { german: "Heute ist es sehr warm", hebrew: "היום חם בחוץ עכשיו" }
    ]
};
