"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GlassCard } from "@/components/GlassCard";

interface Product {
    id: string;
    name: string;
    emoji: string;
    cost: number;
    basePrice: number;
    category: string;
    freshnessDays: number;
    author?: string; // books
    genre?: string;  // books
}

interface StockItem {
    productId: string;
    quantity: number;
    freshnessPercent: number;
}

interface ShelfSlot {
    productId: string;
    freshness: number;
    placedAt: number;
    bookCondition?: "mint" | "good" | "worn" | "beloved";
    isSigned?: boolean;
    hasPersonalNote?: boolean;
    personalNote?: string;
    previousOwner?: string;
}

interface Shelf {
    slots: (ShelfSlot | null)[];
    priceMultiplier: number;
}

interface CustomerRequest {
    type: "specific" | "vague" | "recommendation" | "list" | "budget" | "regular" | "mood";
    text: string;
    validProducts: string[];
    perfectProducts: string[];
    budget?: number;
}

interface ActiveCustomer {
    id: string;
    avatar: string;
    name?: string;
    request: CustomerRequest;
    offeredProducts: { productId: string; price: number }[];
    satisfaction: number;
    currentResponse?: string;
    isRegular: boolean;
    regularId?: string;
}

interface RegularCustomer {
    id: string;
    name: string;
    avatar: string;
    visitCount: number;
    favoriteProducts: string[];
    relationship: number;
    notes: string[];
    lastVisit: number;
    totalSpent: number;
    preferredSeat?: string;
}

interface DilemmaEvent {
    id: string;
    customer: string;
    customerName?: string;
    situation: string;
    choices: {
        text: string;
        emoji: string;
        consequence: string;
    }[];
    choiceEffects: ((state: DilemmaState) => void)[];
}

interface DilemmaState {
    setMoney: React.Dispatch<React.SetStateAction<number>>;
    setReputation: React.Dispatch<React.SetStateAction<number>>;
    notify: (text: string, type: string) => void;
    regulars: RegularCustomer[];
    setRegulars: React.Dispatch<React.SetStateAction<RegularCustomer[]>>;
}

interface Customer {
    id: string;
    x: number;
    y: number;
    state: "entering" | "browsing-books" | "waiting-at-counter" | "being-served" | "reading" | "leaving" | "angry-leaving" | "stealing";
    patience: number;
    maxPatience: number;
    cart: { productId: string; price: number }[];
    avatar: string;
    type: "normal" | "bookworm" | "coffee-lover" | "student" | "writer" | "tourist" | "vip" | "bulk" | "picky" | "thief";
    serveProgress: number;
    isRegular?: boolean;
    regularId?: string;
    caught?: boolean;
}

interface GameEvent {
    id: string;
    type: "book-club" | "poetry-night" | "author-signing" | "rainy-day-rush" | "wifi-outage" | "health-inspector" | "rush-hour" | "supplier-deal" | "viral-review";
    message: string;
    duration: number;
    active: boolean;
}

interface Upgrade {
    id: string;
    name: string;
    description: string;
    cost: number;
    purchased: boolean;
    effect: string;
    emoji: string;
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    emoji: string;
}

const PRODUCTS: Product[] = [
    { id: "espresso", name: "Espresso", emoji: "☕", cost: 2, basePrice: 4, category: "drinks", freshnessDays: 1 },
    { id: "latte", name: "Oat Latte", emoji: "🥛", cost: 3, basePrice: 6, category: "drinks", freshnessDays: 1 },
    { id: "cappuccino", name: "Cappuccino", emoji: "☕", cost: 3, basePrice: 5, category: "drinks", freshnessDays: 1 },
    { id: "hotchoc", name: "Hot Chocolate", emoji: "🍫", cost: 2, basePrice: 5, category: "drinks", freshnessDays: 1 },
    { id: "matcha", name: "Matcha Latte", emoji: "🍵", cost: 4, basePrice: 7, category: "drinks", freshnessDays: 1 },
    { id: "chai", name: "Spiced Chai", emoji: "🫖", cost: 3, basePrice: 6, category: "drinks", freshnessDays: 1 },
    { id: "tea", name: "Herbal Tea", emoji: "🍵", cost: 2, basePrice: 4, category: "drinks", freshnessDays: 30 },

    { id: "croissant", name: "Butter Croissant", emoji: "🥐", cost: 2, basePrice: 5, category: "pastry", freshnessDays: 2 },
    { id: "almondcroissant", name: "Almond Croissant", emoji: "🥐", cost: 3, basePrice: 6, category: "pastry", freshnessDays: 2 },
    { id: "muffin", name: "Blueberry Muffin", emoji: "🧁", cost: 2, basePrice: 4, category: "pastry", freshnessDays: 3 },
    { id: "cinnamon", name: "Cinnamon Roll", emoji: "🍥", cost: 3, basePrice: 5, category: "pastry", freshnessDays: 2 },
    { id: "scone", name: "Cranberry Scone", emoji: "🍪", cost: 2, basePrice: 4, category: "pastry", freshnessDays: 3 },
    { id: "cake", name: "Slice of Cake", emoji: "🍰", cost: 4, basePrice: 7, category: "pastry", freshnessDays: 3 },
    { id: "avotoast", name: "Avocado Toast", emoji: "🥑", cost: 5, basePrice: 10, category: "food", freshnessDays: 1 },
    { id: "sandwich", name: "Grilled Cheese", emoji: "🧀", cost: 4, basePrice: 9, category: "food", freshnessDays: 1 },
    { id: "soup", name: "Soup of the Day", emoji: "🥣", cost: 4, basePrice: 8, category: "food", freshnessDays: 1 },

    { id: "mystery", name: "Cozy Mystery", emoji: "📕", cost: 8, basePrice: 17, category: "books", freshnessDays: 999, author: "Eleanor Finch", genre: "Mystery" },
    { id: "romance", name: "Romance Novel", emoji: "📗", cost: 7, basePrice: 16, category: "books", freshnessDays: 999, author: "Sophie Chen", genre: "Romance" },
    { id: "fantasy", name: "Fantasy Epic", emoji: "📘", cost: 9, basePrice: 19, category: "books", freshnessDays: 999, author: "Marcus Thorne", genre: "Fantasy" },
    { id: "poetry", name: "Poetry Collection", emoji: "📙", cost: 6, basePrice: 15, category: "books", freshnessDays: 999, author: "River Williams", genre: "Poetry" },
    { id: "cookbook", name: "Cozy Cookbook", emoji: "📒", cost: 12, basePrice: 25, category: "books", freshnessDays: 999, author: "Marie Laurent", genre: "Cooking" },
    { id: "classic", name: "Classic Novel", emoji: "📓", cost: 10, basePrice: 23, category: "books", freshnessDays: 999, author: "Jane Austen", genre: "Classic" },
    { id: "selfhelp", name: "Slow Living Guide", emoji: "📔", cost: 8, basePrice: 18, category: "books", freshnessDays: 999, author: "Hannah Brooks", genre: "Lifestyle" },
    { id: "childrens", name: "Picture Book", emoji: "📚", cost: 5, basePrice: 13, category: "books", freshnessDays: 999, author: "Yuki Tanaka", genre: "Children" },

    { id: "bookmark", name: "Leather Bookmark", emoji: "🔖", cost: 3, basePrice: 8, category: "gifts", freshnessDays: 999 },
    { id: "journal", name: "Linen Journal", emoji: "📖", cost: 8, basePrice: 18, category: "gifts", freshnessDays: 999 },
    { id: "candle", name: "Book-Scent Candle", emoji: "🕯️", cost: 10, basePrice: 22, category: "gifts", freshnessDays: 999 },
    { id: "mug", name: "Reading Mug", emoji: "🍵", cost: 7, basePrice: 16, category: "gifts", freshnessDays: 999 },
    { id: "tote", name: "Canvas Book Tote", emoji: "👜", cost: 9, basePrice: 20, category: "gifts", freshnessDays: 999 },
];

const COMBOS: { products: string[]; bonus: number; name: string }[] = [
    { products: ["latte", "croissant"], bonus: 3, name: "☕ Parisian Morning" },
    { products: ["hotchoc", "cake"], bonus: 4, name: "🍫 Indulgent Treat" },
    { products: ["tea", "scone"], bonus: 3, name: "🫖 Afternoon Tea" },
    { products: ["espresso", "mystery"], bonus: 5, name: "📕 Detective's Break" },
    { products: ["chai", "romance"], bonus: 5, name: "💕 Cozy Romance" },
    { products: ["matcha", "selfhelp"], bonus: 5, name: "🧘 Mindful Moment" },
    { products: ["cappuccino", "cinnamon"], bonus: 3, name: "🍥 Sweet Start" },
    { products: ["hotchoc", "childrens"], bonus: 4, name: "📚 Storytime Special" },
    { products: ["latte", "avotoast"], bonus: 4, name: "🥑 Brunch Goals" },
    { products: ["candle", "poetry"], bonus: 6, name: "✨ Cozy Night In" },
    { products: ["journal", "bookmark"], bonus: 4, name: "📝 Writer's Kit" },
    { products: ["mug", "tea", "mystery"], bonus: 7, name: "🕵️ Rainy Day Bundle" },
    { products: ["soup", "classic"], bonus: 5, name: "📖 Comfort Combo" },
    { products: ["fantasy", "matcha"], bonus: 5, name: "🐉 Adventure Awaits" },
];

const CUSTOMER_AVATARS = ["👩", "👨", "👵", "👴", "🧑", "👩‍🦰", "👨‍🦱", "👩‍🦳", "👨‍🦲", "🧔", "👱‍♀️", "👱", "🧑‍🎓", "👩‍💻", "👨‍🎨"];
const BOOKWORM_AVATARS = ["🤓", "👓", "📚", "🧑‍🏫"];
const WRITER_AVATARS = ["✍️", "🖊️", "👩‍💻", "🎭"];
const STUDENT_AVATARS = ["🧑‍🎓", "👩‍🎓", "📝", "🎒"];
const TOURIST_AVATARS = ["📸", "🗺️", "🧳", "🌍"];
const VIP_AVATARS = ["👑", "💎", "🎩", "✨", "🌟"];
const THIEF_AVATARS = ["🥷", "😈", "🕵️", "👤", "🦹"];

const BOOK_CONDITIONS: { condition: "mint" | "good" | "worn" | "beloved"; emoji: string; priceModifier: number; description: string }[] = [
    { condition: "mint", emoji: "✨", priceModifier: 1.3, description: "Brand new, spine uncracked" },
    { condition: "good", emoji: "📖", priceModifier: 1.0, description: "Lightly read, good shape" },
    { condition: "worn", emoji: "📜", priceModifier: 0.7, description: "Well-loved, shows character" },
    { condition: "beloved", emoji: "💝", priceModifier: 1.5, description: "Full of notes & memories" },
];

const PREVIOUS_OWNERS = [
    "a philosophy professor", "a retired librarian", "a traveling poet",
    "a lighthouse keeper", "a mysterious stranger", "an old book collector",
    "a hopeless romantic", "a former detective", "a tea shop owner",
    "someone who underlined every other line", "a person who wrote 'YES!' in the margins",
    "someone who pressed flowers between pages", "a grandmother who loved this story"
];

const PERSONAL_NOTES = [
    "This one changed my life! 💫", "Perfect for rainy days ☔",
    "Made me cry happy tears 🥹", "Staff favorite! ⭐",
    "Couldn't put it down!", "Read this with hot cocoa 🍫",
    "A hidden gem 💎", "Trust me on this one!",
    "Better than the movie!", "Life-changing wisdom inside",
    "My personal comfort book 🧸", "You NEED this story!"
];

const BOOK_BROWSING_DIALOGUE = [
    { customer: "Hmm, what's this one about?", response: "It's about..." },
    { customer: "Have you read this?", response: "Yes! It's wonderful." },
    { customer: "Is this good for a gift?", response: "Perfect choice!" },
    { customer: "I've heard of this author...", response: "They're fantastic." },
    { customer: "What would you recommend?", response: "Let me show you..." },
];

const REGULAR_NAMES = [
    "Mrs. Chen",
    "Old Thomas",
    "Professor Oak",
    "Young Emma",
    "Grandma Rose",
    "Oliver the Writer",
    "Bookclub Betty",
    "Sleepy Sam",
    "Marina the Poet",
    "Dr. Patel",
    "Café Colin",
    "Penny & her Pup"
];

const REQUEST_TEMPLATES: Omit<CustomerRequest, 'budget'>[] = [
    { type: "specific", text: "Just a latte, please.", validProducts: ["latte"], perfectProducts: ["latte"] },
    { type: "specific", text: "One espresso. Make it strong.", validProducts: ["espresso"], perfectProducts: ["espresso"] },
    { type: "specific", text: "I'll take a croissant.", validProducts: ["croissant"], perfectProducts: ["croissant"] },
    { type: "specific", text: "Hot chocolate, please!", validProducts: ["hotchoc"], perfectProducts: ["hotchoc"] },
    { type: "specific", text: "Do you have herbal tea?", validProducts: ["tea"], perfectProducts: ["tea"] },
    { type: "specific", text: "A blueberry muffin would be lovely.", validProducts: ["muffin"], perfectProducts: ["muffin"] },
    { type: "specific", text: "I'm looking for a good mystery novel.", validProducts: ["mystery"], perfectProducts: ["mystery"] },
    { type: "specific", text: "Any romance novels?", validProducts: ["romance"], perfectProducts: ["romance"] },

    { type: "vague", text: "I need something to wake me up...", validProducts: ["espresso", "latte", "cappuccino", "matcha"], perfectProducts: ["espresso", "latte"] },
    { type: "vague", text: "Something sweet to cheer me up?", validProducts: ["cake", "cinnamon", "hotchoc", "muffin"], perfectProducts: ["cake", "cinnamon"] },
    { type: "vague", text: "I'm meeting a friend for a light bite...", validProducts: ["croissant", "scone", "muffin", "tea"], perfectProducts: ["scone", "tea"] },
    { type: "vague", text: "It's raining and I need comfort.", validProducts: ["soup", "hotchoc", "chai", "mystery"], perfectProducts: ["soup", "hotchoc"] },
    { type: "vague", text: "I want to feel cozy this afternoon.", validProducts: ["chai", "tea", "candle", "romance", "hotchoc"], perfectProducts: ["chai", "candle"] },
    { type: "vague", text: "My niece is turning 5 next week...", validProducts: ["childrens", "cake", "hotchoc"], perfectProducts: ["childrens"] },
    { type: "vague", text: "I'm hosting book club tonight!", validProducts: ["mystery", "romance", "classic", "cake", "tea"], perfectProducts: ["mystery", "cake"] },
    { type: "vague", text: "Something to help me relax and unwind?", validProducts: ["tea", "poetry", "candle", "selfhelp"], perfectProducts: ["tea", "candle"] },
    { type: "vague", text: "I'm looking for a gift for my mom who loves to read.", validProducts: ["classic", "bookmark", "candle", "tote", "journal"], perfectProducts: ["classic", "bookmark"] },
    { type: "vague", text: "Need brain fuel for studying...", validProducts: ["espresso", "latte", "muffin", "avotoast"], perfectProducts: ["latte", "avotoast"] },
    { type: "vague", text: "Something for a long train journey?", validProducts: ["fantasy", "mystery", "romance", "coffee"], perfectProducts: ["fantasy", "mystery"] },
    { type: "vague", text: "I want to start journaling...", validProducts: ["journal", "selfhelp", "poetry", "tea"], perfectProducts: ["journal", "selfhelp"] },
    { type: "vague", text: "My partner loves fantasy worlds.", validProducts: ["fantasy", "matcha", "candle"], perfectProducts: ["fantasy"] },
    { type: "vague", text: "Something European feeling?", validProducts: ["croissant", "espresso", "classic", "almondcroissant"], perfectProducts: ["croissant", "espresso"] },
    { type: "vague", text: "I'm heartbroken and need an escape...", validProducts: ["romance", "cake", "hotchoc", "fantasy"], perfectProducts: ["fantasy", "hotchoc"] },

    { type: "mood", text: "I'm feeling nostalgic today...", validProducts: ["classic", "tea", "scone", "candle"], perfectProducts: ["classic", "tea"] },
    { type: "mood", text: "I want to feel inspired!", validProducts: ["poetry", "espresso", "journal", "matcha"], perfectProducts: ["poetry", "journal"] },
    { type: "mood", text: "Sleepy Sunday vibes...", validProducts: ["chai", "cinnamon", "romance", "hotchoc"], perfectProducts: ["chai", "romance"] },
    { type: "mood", text: "I'm in a adventurous mood!", validProducts: ["fantasy", "espresso", "matcha"], perfectProducts: ["fantasy", "espresso"] },
    { type: "mood", text: "Feeling creative today.", validProducts: ["journal", "poetry", "latte", "candle"], perfectProducts: ["journal", "latte"] },

    { type: "recommendation", text: "What book would you recommend?", validProducts: [], perfectProducts: [] },
    { type: "recommendation", text: "What's your most popular drink?", validProducts: [], perfectProducts: [] },
    { type: "recommendation", text: "Surprise me with something good!", validProducts: [], perfectProducts: [] },
    { type: "recommendation", text: "What would YOU order right now?", validProducts: [], perfectProducts: [] },
    { type: "recommendation", text: "I trust your taste. Pick a book for me!", validProducts: [], perfectProducts: [] },
    { type: "recommendation", text: "What pairs well together here?", validProducts: [], perfectProducts: [] },
    { type: "recommendation", text: "What's the coziest thing you sell?", validProducts: [], perfectProducts: [] },

    { type: "budget", text: "I've got $10. What can I get?", validProducts: ["latte", "croissant", "muffin", "tea", "scone"], perfectProducts: ["latte", "croissant"] },
    { type: "budget", text: "Only $15 left this week for treats...", validProducts: ["tea", "muffin", "poetry", "bookmark"], perfectProducts: ["tea", "poetry"] },
    { type: "budget", text: "I want a book but I'm on a tight budget.", validProducts: ["childrens", "poetry", "romance"], perfectProducts: ["poetry"] },
    { type: "budget", text: "Just $5 for something quick?", validProducts: ["espresso", "tea", "muffin", "scone"], perfectProducts: ["espresso", "muffin"] },
    { type: "budget", text: "I have $25 for a nice gift.", validProducts: ["candle", "journal", "tote", "cookbook"], perfectProducts: ["candle", "journal"] },

    { type: "list", text: "A latte AND a croissant please!", validProducts: ["latte", "croissant"], perfectProducts: ["latte", "croissant"] },
    { type: "list", text: "Tea, a scone, and maybe a book?", validProducts: ["tea", "scone", "mystery", "romance", "classic"], perfectProducts: ["tea", "scone", "mystery"] },
    { type: "list", text: "Two hot chocolates and some cake!", validProducts: ["hotchoc", "cake"], perfectProducts: ["hotchoc", "cake"] },
    { type: "list", text: "Espresso and avocado toast.", validProducts: ["espresso", "avotoast"], perfectProducts: ["espresso", "avotoast"] },
    { type: "list", text: "I need a journal, a candle, and something to read.", validProducts: ["journal", "candle", "poetry", "selfhelp", "romance"], perfectProducts: ["journal", "candle", "poetry"] },
    { type: "list", text: "Soup and grilled cheese, please!", validProducts: ["soup", "sandwich"], perfectProducts: ["soup", "sandwich"] },
    { type: "list", text: "A bookmark and a good mystery.", validProducts: ["bookmark", "mystery"], perfectProducts: ["bookmark", "mystery"] },

    { type: "regular", text: "The usual, please.", validProducts: [], perfectProducts: [] },
    { type: "regular", text: "You know what I like!", validProducts: [], perfectProducts: [] },
    { type: "regular", text: "Same as always, dear.", validProducts: [], perfectProducts: [] },
    { type: "regular", text: "My regular order, if you remember...", validProducts: [], perfectProducts: [] },
];

const DILEMMA_TEMPLATES: Omit<DilemmaEvent, 'id' | 'choiceEffects'>[] = [
    {
        customer: "🧒",
        situation: "A child is counting pennies for a hot chocolate. They're 50¢ short and look so hopeful...",
        choices: [
            { text: "On the house, sweetie", emoji: "💝", consequence: "Their face lights up. Their parent becomes a devoted regular!" },
            { text: "Sorry, that's the price", emoji: "📋", consequence: "They leave sadly with their coins. Business is business." }
        ]
    },
    {
        customer: "👵",
        customerName: "Grandma Rose",
        situation: "Your most loyal regular forgot her wallet. She's been coming every day for 3 years.",
        choices: [
            { text: "Start a tab for her", emoji: "📝", consequence: "She tears up with gratitude. She'll pay double tomorrow." },
            { text: "I can't make exceptions", emoji: "🚫", consequence: "She understands, but looks hurt. Other regulars notice." }
        ]
    },
    {
        customer: "✍️",
        customerName: "Oliver the Writer",
        situation: "A struggling writer has been here all day on one coffee. He's working on his novel and looks exhausted.",
        choices: [
            { text: "Refill on the house", emoji: "☕", consequence: "He dedicates his book to 'The Cozy Chapter' when it's published!" },
            { text: "Need to order more to stay", emoji: "💰", consequence: "He leaves to write at home. Fair enough." }
        ]
    },
    {
        customer: "🧑‍🎓",
        situation: "A stressed student has been studying for hours. Finals week. They look like they might cry.",
        choices: [
            { text: "Free cookie and encouragement", emoji: "🍪", consequence: "They ace their exam and bring their whole study group here!" },
            { text: "Just focus on paying customers", emoji: "📖", consequence: "They keep studying. You keep working." }
        ]
    },
    {
        customer: "📚",
        customerName: "Bookclub Betty",
        situation: "A book club wants to meet here weekly but can't afford much. 8 people, minimal orders.",
        choices: [
            { text: "Welcome! Space is free", emoji: "❤️", consequence: "The book club becomes your biggest advocates. Word spreads!" },
            { text: "We need minimum orders", emoji: "💵", consequence: "They meet at the library instead. Reasonable." }
        ]
    },
    {
        customer: "👴",
        customerName: "Old Thomas",
        situation: "An elderly widower sits alone every morning. He nurses one tea for hours. It's his only social contact.",
        choices: [
            { text: "He's always welcome", emoji: "🏠", consequence: "He becomes part of the family. Other customers love him." },
            { text: "Can't tie up tables", emoji: "⏰", consequence: "He comes less often. The morning regulars ask about him." }
        ]
    },
    {
        customer: "🏃",
        situation: "A big chain coffee shop wants to buy you out. The offer is generous...",
        choices: [
            { text: "This isn't for sale", emoji: "🏪", consequence: "Your regulars throw a celebration. Community over profit." },
            { text: "Take the money", emoji: "💰", consequence: "You retire comfortably. The cafe becomes a franchise. Regulars scatter." }
        ]
    },
    {
        customer: "🌧️",
        situation: "A homeless person asks if they can sit inside during a storm. They can't buy anything.",
        choices: [
            { text: "Come in, warm up", emoji: "🏠", consequence: "They're deeply grateful. A customer pays for their meal." },
            { text: "Sorry, customers only", emoji: "🚪", consequence: "They find shelter elsewhere. Some customers look disappointed." }
        ]
    },
    {
        customer: "📖",
        situation: "You discover a rare first edition book worth $500. A regular collector would treasure it... or you could sell it to a dealer for max profit.",
        choices: [
            { text: "Sell to the collector at fair price", emoji: "🤝", consequence: "They cry happy tears. They tell every book lover in town." },
            { text: "Sell to the dealer", emoji: "💵", consequence: "Good profit! But you wonder if it found a good home." }
        ]
    },
    {
        customer: "👩‍🎨",
        situation: "A local artist asks to display their work for free. It might not match your aesthetic.",
        choices: [
            { text: "Art belongs everywhere", emoji: "🎨", consequence: "Customers love it! The artist becomes famous and credits you." },
            { text: "Doesn't fit the vibe", emoji: "🖼️", consequence: "You keep your curated look. The artist understands." }
        ]
    },
    {
        customer: "🐕",
        situation: "A guide dog owner asks if their dog can come inside. You're not technically pet-friendly...",
        choices: [
            { text: "Service animals always welcome", emoji: "🐕‍🦺", consequence: "You update your policy. The accessibility community takes notice!" },
            { text: "Can't make exceptions", emoji: "📋", consequence: "They sit on the patio instead. Legal, but feels cold." }
        ]
    },
    {
        customer: "🎭",
        situation: "A reviewer offers a glowing write-up in exchange for free food. It's... not exactly ethical.",
        choices: [
            { text: "We earn reviews honestly", emoji: "⭐", consequence: "They leave. Your authentic reviews stay trustworthy." },
            { text: "Take the deal", emoji: "📰", consequence: "Great publicity! But you feel a bit hollow." }
        ]
    },
];

const INITIAL_UPGRADES: Upgrade[] = [
    { id: "bookshelf1", name: "Extra Bookshelf", description: "Display more books", cost: 100, purchased: false, effect: "shelf", emoji: "📚" },
    { id: "bookshelf2", name: "Cozy Display Case", description: "Even more display space", cost: 200, purchased: false, effect: "shelf", emoji: "🗄️" },

    { id: "espresso-pro", name: "Pro Espresso Machine", description: "Make drinks 30% faster", cost: 150, purchased: false, effect: "speed", emoji: "☕" },
    { id: "speed2", name: "Double Grinder", description: "Serve 50% faster", cost: 300, purchased: false, effect: "speed", emoji: "⚡" },

    { id: "pastry-case", name: "Pastry Display Case", description: "Pastries stay fresh 50% longer", cost: 180, purchased: false, effect: "freshness", emoji: "🥐" },
    { id: "fridge", name: "Better Refrigeration", description: "All perishables last longer", cost: 200, purchased: false, effect: "freshness", emoji: "❄️" },

    { id: "fireplace", name: "Cozy Fireplace", description: "20% more customers, longer stays", cost: 250, purchased: false, effect: "attraction", emoji: "🔥" },
    { id: "reading-nook", name: "Reading Nook", description: "Bookworms stay & buy more", cost: 300, purchased: false, effect: "attraction", emoji: "🛋️" },
    { id: "fairy-lights", name: "Fairy Lights", description: "Instagram-worthy! 15% more visitors", cost: 120, purchased: false, effect: "attraction", emoji: "✨" },
    { id: "plants", name: "Plant Corner", description: "Cozy vibes, happier customers", cost: 100, purchased: false, effect: "attraction", emoji: "🪴" },

    { id: "cat", name: "Adopt Shop Cat", description: "Customers love Hemingway! +happiness", cost: 150, purchased: false, effect: "happiness", emoji: "🐱" },
    { id: "wifi", name: "Fast WiFi", description: "Students & writers love it", cost: 80, purchased: false, effect: "attraction", emoji: "📶" },
    { id: "music", name: "Vinyl Player", description: "Better ambiance, calmer customers", cost: 120, purchased: false, effect: "patience", emoji: "🎵" },

    { id: "storage", name: "Back Room Storage", description: "Hold 50% more stock", cost: 150, purchased: false, effect: "storage", emoji: "📦" },
    { id: "patio", name: "Garden Patio", description: "Outdoor seating, more capacity", cost: 400, purchased: false, effect: "capacity", emoji: "🌿" },

    { id: "bookclub", name: "Book Club Hosting", description: "Weekly book clubs visit", cost: 200, purchased: false, effect: "bookclub", emoji: "📖" },
    { id: "signing-table", name: "Author Signing Table", description: "Host author events", cost: 350, purchased: false, effect: "events", emoji: "✍️" },
    { id: "poetry-corner", name: "Poetry Corner", description: "Open mic nights attract artists", cost: 180, purchased: false, effect: "events", emoji: "🎭" },
];

const ACHIEVEMENTS: Achievement[] = [
    { id: "first-sale", name: "First Customer!", description: "Make your first sale", unlocked: false, emoji: "☕" },
    { id: "100-sales", name: "Hundred Stories", description: "Serve 100 customers", unlocked: false, emoji: "💯" },
    { id: "1000-sales", name: "Community Pillar", description: "Serve 1000 customers", unlocked: false, emoji: "🏛️" },
    { id: "1000-money", name: "Thriving Business", description: "Have $1000 at once", unlocked: false, emoji: "💰" },
    { id: "5000-money", name: "Expansion Dreams", description: "Have $5000 at once", unlocked: false, emoji: "🌟" },

    { id: "first-combo", name: "Perfect Pairing", description: "Sell your first combo", unlocked: false, emoji: "🤝" },
    { id: "combo-master", name: "Pairing Expert", description: "Sell 25 combos", unlocked: false, emoji: "🎯" },
    { id: "all-combos", name: "Combo Connoisseur", description: "Trigger every combo type", unlocked: false, emoji: "👨‍🍳" },

    { id: "5-star", name: "Five Star Review", description: "Get 5-star average rating", unlocked: false, emoji: "⭐" },
    { id: "beloved", name: "Neighborhood Gem", description: "Reach max reputation", unlocked: false, emoji: "❤️" },

    { id: "first-regular", name: "A Familiar Face", description: "Get your first regular", unlocked: false, emoji: "👋" },
    { id: "5-regulars", name: "The Usual Crowd", description: "Have 5 regular customers", unlocked: false, emoji: "👥" },
    { id: "best-friend", name: "Best Customer", description: "Max relationship with a regular", unlocked: false, emoji: "🤗" },

    { id: "first-book", name: "Book Sold!", description: "Sell your first book", unlocked: false, emoji: "📚" },
    { id: "100-books", name: "Little Library", description: "Sell 100 books", unlocked: false, emoji: "📖" },
    { id: "all-genres", name: "Well-Read", description: "Sell every book genre", unlocked: false, emoji: "🎓" },
    { id: "first-signed", name: "Autograph Hunter", description: "Sell your first signed book", unlocked: false, emoji: "✍️" },
    { id: "10-signed", name: "Rare Finds", description: "Sell 10 signed books", unlocked: false, emoji: "💎" },
    { id: "beloved-book", name: "Passed Down", description: "Sell a beloved book with history", unlocked: false, emoji: "💝" },
    { id: "book-whisperer", name: "Book Whisperer", description: "Make 25 successful book recommendations", unlocked: false, emoji: "🔮" },
    { id: "mint-collector", name: "Mint Collector", description: "Sell 10 mint condition books", unlocked: false, emoji: "✨" },

    { id: "week-1", name: "First Week", description: "Survive 7 days", unlocked: false, emoji: "📅" },
    { id: "month-1", name: "One Month In", description: "Reach day 30", unlocked: false, emoji: "📆" },
    { id: "year-1", name: "Anniversary", description: "Reach day 365", unlocked: false, emoji: "🎂" },

    { id: "cozy-master", name: "Cozy Master", description: "Buy all ambiance upgrades", unlocked: false, emoji: "🏠" },
    { id: "cat-person", name: "Cat Person", description: "Pet Hemingway 50 times", unlocked: false, emoji: "🐱" },
    { id: "rainy-day", name: "Rainy Day Magic", description: "Have a perfect day during rain", unlocked: false, emoji: "🌧️" },
    { id: "book-club", name: "Club Host", description: "Host 10 book clubs", unlocked: false, emoji: "📕" },
    { id: "kind-heart", name: "Kind Heart", description: "Choose compassion in 5 dilemmas", unlocked: false, emoji: "💝" },
    { id: "author-event", name: "Author's Friend", description: "Host an author signing", unlocked: false, emoji: "✍️" },
    { id: "night-owl", name: "Night Owl", description: "Stay open past midnight", unlocked: false, emoji: "🦉" },
];

const SPECIAL_EVENTS = [
    {
        id: "book-club",
        type: "book-club" as const,
        message: "📚 Book Club Night! A group arrives to discuss this month's mystery...",
        duration: 3,
        active: false
    },
    {
        id: "poetry-night",
        type: "poetry-night" as const,
        message: "🎭 Open Mic Poetry Night! Artists and dreamers fill every seat...",
        duration: 2,
        active: false
    },
    {
        id: "author-signing",
        type: "author-signing" as const,
        message: "✍️ Author Signing! A local writer draws a crowd for their new book...",
        duration: 4,
        active: false
    },
    {
        id: "rainy-rush",
        type: "rainy-day-rush" as const,
        message: "🌧️ Rainy Day Rush! Everyone seeks shelter and hot drinks...",
        duration: 3,
        active: false
    },
    {
        id: "wifi-out",
        type: "wifi-outage" as const,
        message: "📵 WiFi Outage! Students panic, but book sales go up...",
        duration: 2,
        active: false
    },
    {
        id: "inspector",
        type: "health-inspector" as const,
        message: "📋 Health Inspector! Keep everything fresh and clean...",
        duration: 1,
        active: false
    },
];

export default function ShopGame() {
    const [money, setMoney] = useState(150);
    const [storage, setStorage] = useState<Record<string, StockItem>>({});
    const [shelves, setShelves] = useState<Shelf[]>([
        { slots: [null, null, null, null, null, null], priceMultiplier: 1.2 },
        { slots: [null, null, null, null, null, null], priceMultiplier: 1.2 },
    ]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const [activeCustomer, setActiveCustomer] = useState<ActiveCustomer | null>(null);

    const [regulars, setRegulars] = useState<RegularCustomer[]>([]);

    const [currentDilemma, setCurrentDilemma] = useState<DilemmaEvent | null>(null);
    const [dilemmaResult, setDilemmaResult] = useState<string | null>(null);

    const [reputation, setReputation] = useState(50);

    const [tomorrowTeaser, setTomorrowTeaser] = useState<string>("");

    const [showTablet, setShowTablet] = useState(false);
    const [showStorage, setShowStorage] = useState(false);
    const [showUpgrades, setShowUpgrades] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showRegulars, setShowRegulars] = useState(false);
    const [cart, setCart] = useState<Record<string, number>>({});
    const [notifications, setNotifications] = useState<{ id: string; text: string; type: string }[]>([]);

    const [day, setDay] = useState(1);
    const [timeOfDay, setTimeOfDay] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isPrepTime, setIsPrepTime] = useState(true);
    const [showDaySummary, setShowDaySummary] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const [dailySales, setDailySales] = useState(0);
    const [dailyCustomers, setDailyCustomers] = useState(0);
    const [totalSales, setTotalSales] = useState(0);
    const [totalCustomersServed, setTotalCustomersServed] = useState(0);
    const [combosTriggered, setCombosTriggered] = useState(0);
    const [vipsServed, setVipsServed] = useState(0);
    const [thievesCaught, setThievesCaught] = useState(0);
    const [stolenValue, setStolenValue] = useState(0);
    const [regularsServed, setRegularsServed] = useState(0);
    const [perfectServings, setPerfectServings] = useState(0);

    const rent = 30 + (day * 5);
    const [debt, setDebt] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const [reviews, setReviews] = useState<{ rating: number; text: string; avatar: string }[]>([]);
    const [showReviews, setShowReviews] = useState(false);

    const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
    const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
    const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

    const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);

    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

    const [pendingBookTrade, setPendingBookTrade] = useState<{ offer: string; value: number } | null>(null);
    const [booksSold, setBooksSold] = useState(0);
    const [signedBooksSold, setSignedBooksSold] = useState(0);
    const [recommendedBooks, setRecommendedBooks] = useState(0);

    const [bookCorner, setBookCorner] = useState<(ShelfSlot | null)[]>([null, null, null, null, null, null, null, null]); // 8 book display slots
    const [showBookCorner, setShowBookCorner] = useState(false);
    const [bookBrowsingCustomer, setBookBrowsingCustomer] = useState<{ avatar: string; dialogue: string; interest: number } | null>(null);

    const shelvesRef = useRef(shelves);
    const customersRef = useRef(customers);
    const regularsRef = useRef(regulars);
    const timeOfDayRef = useRef(timeOfDay);
    const currentEventRef = useRef(currentEvent);
    const dayRef = useRef(day);
    const activeCustomerRef = useRef(activeCustomer);

    useEffect(() => { shelvesRef.current = shelves; }, [shelves]);
    useEffect(() => { customersRef.current = customers; }, [customers]);
    useEffect(() => { regularsRef.current = regulars; }, [regulars]);
    useEffect(() => { timeOfDayRef.current = timeOfDay; }, [timeOfDay]);
    useEffect(() => { currentEventRef.current = currentEvent; }, [currentEvent]);
    useEffect(() => { dayRef.current = day; }, [day]);
    useEffect(() => { activeCustomerRef.current = activeCustomer; }, [activeCustomer]);

    const shelfCount = 2 + upgrades.filter(u => u.purchased && u.effect === "shelf").length;
    const hasCamera = upgrades.find(u => u.id === "camera")?.purchased;

    const hasPastryCase = upgrades.find(u => u.id === "pastry-case")?.purchased;
    const hasFridge = upgrades.find(u => u.id === "fridge")?.purchased;
    const freshnessBonus = (hasPastryCase ? 0.3 : 0) + (hasFridge ? 0.2 : 0);

    const hasEspressoPro = upgrades.find(u => u.id === "espresso-pro")?.purchased;
    const hasDoubleGrinder = upgrades.find(u => u.id === "speed2")?.purchased;
    const speedBonus = (hasEspressoPro ? 0.3 : 0) + (hasDoubleGrinder ? 0.5 : 0);

    const hasFireplace = upgrades.find(u => u.id === "fireplace")?.purchased;
    const hasReadingNook = upgrades.find(u => u.id === "reading-nook")?.purchased;
    const hasFairyLights = upgrades.find(u => u.id === "fairy-lights")?.purchased;
    const hasPlants = upgrades.find(u => u.id === "plants")?.purchased;
    const hasWifi = upgrades.find(u => u.id === "wifi")?.purchased;
    const customerBonus =
        (hasFireplace ? 0.2 : 0) +
        (hasReadingNook ? 0.1 : 0) +
        (hasFairyLights ? 0.15 : 0) +
        (hasPlants ? 0.1 : 0) +
        (hasWifi ? 0.15 : 0);

    const hasCat = upgrades.find(u => u.id === "cat")?.purchased;
    const happinessBonus = hasCat ? 0.2 : 0;

    const hasMusic = upgrades.find(u => u.id === "music")?.purchased;
    const patienceBonus = (hasMusic ? 0.3 : 0) + (hasFireplace ? 0.2 : 0);

    const hasStorage = upgrades.find(u => u.id === "storage")?.purchased;
    const storageBonus = hasStorage ? 0.5 : 0;

    const hasPatio = upgrades.find(u => u.id === "patio")?.purchased;
    const capacityBonus = hasPatio ? 2 : 0;

    const vipBonus = hasReadingNook;

    const hasBookClub = upgrades.find(u => u.id === "bookclub")?.purchased;
    const hasSigningTable = upgrades.find(u => u.id === "signing-table")?.purchased;
    const hasPoetryCorner = upgrades.find(u => u.id === "poetry-corner")?.purchased;

    const averageRating = reviews.length > 0
        ? reviews.slice(0, 30).reduce((a, b) => a + b.rating, 0) / Math.min(reviews.length, 30)
        : 3;

    const timePeriod = timeOfDay < 35 ? 'morning' : timeOfDay < 70 ? 'afternoon' : 'evening';

    const getUniqueStockedProductIds = useCallback(() => {
        const ids = new Set<string>();
        shelves.forEach(shelf => {
            shelf.slots.forEach(slot => {
                if (slot) {
                    const product = PRODUCTS.find(p => p.id === slot.productId);
                    if (product?.category !== "books") {
                        ids.add(slot.productId);
                    }
                }
            });
        });
        return Array.from(ids);
    }, [shelves]);

    const getBookCornerBooks = useCallback(() => {
        const books: { productId: string; slot: ShelfSlot; index: number }[] = [];
        bookCorner.forEach((slot, index) => {
            if (slot) {
                books.push({ productId: slot.productId, slot, index });
            }
        });
        return books;
    }, [bookCorner]);

    const isBookProduct = useCallback((productId: string) => {
        const product = PRODUCTS.find(p => p.id === productId);
        return product?.category === "books";
    }, []);

    type SlotInfo = {
        shelfIndex: number;
        slotIndex: number;
        freshness: number;
        bookCondition?: "mint" | "good" | "worn" | "beloved";
        isSigned?: boolean;
        hasPersonalNote?: boolean;
        personalNote?: string;
        previousOwner?: string;
    };

    const getFreshestSlot = useCallback((productId: string): SlotInfo | null => {
        let best: SlotInfo | null = null;
        const product = PRODUCTS.find(p => p.id === productId);
        const isBook = product?.category === "books";

        if (isBook) {
            bookCorner.forEach((slot, slotIdx) => {
                if (slot && slot.productId === productId) {
                    const slotInfo: SlotInfo = {
                        shelfIndex: -1, // -1 indicates Book Corner
                        slotIndex: slotIdx,
                        freshness: slot.freshness,
                        bookCondition: slot.bookCondition,
                        isSigned: slot.isSigned,
                        hasPersonalNote: slot.hasPersonalNote,
                        personalNote: slot.personalNote,
                        previousOwner: slot.previousOwner
                    };

                    if (!best) {
                        best = slotInfo;
                    } else {
                        const priority = (s: SlotInfo) => {
                            let score = 0;
                            if (s.isSigned) score += 100;
                            if (s.bookCondition === "beloved") score += 50;
                            if (s.bookCondition === "mint") score += 30;
                            if (s.bookCondition === "good") score += 20;
                            if (s.hasPersonalNote) score += 10;
                            return score;
                        };
                        if (priority(slotInfo) > priority(best)) {
                            best = slotInfo;
                        }
                    }
                }
            });

            if (best) return best;
        }

        shelves.forEach((shelf, shelfIdx) => {
            shelf.slots.forEach((slot, slotIdx) => {
                if (slot && slot.productId === productId) {
                    const slotInfo: SlotInfo = {
                        shelfIndex: shelfIdx,
                        slotIndex: slotIdx,
                        freshness: slot.freshness,
                        bookCondition: slot.bookCondition,
                        isSigned: slot.isSigned,
                        hasPersonalNote: slot.hasPersonalNote,
                        personalNote: slot.personalNote,
                        previousOwner: slot.previousOwner
                    };

                    if (!best) {
                        best = slotInfo;
                    } else if (isBook) {
                        const priority = (s: SlotInfo) => {
                            let score = 0;
                            if (s.isSigned) score += 100;
                            if (s.bookCondition === "beloved") score += 50;
                            if (s.bookCondition === "mint") score += 30;
                            if (s.bookCondition === "good") score += 20;
                            if (s.hasPersonalNote) score += 10;
                            return score;
                        };
                        if (priority(slotInfo) > priority(best)) {
                            best = slotInfo;
                        }
                    } else if (slot.freshness > best.freshness) {
                        best = slotInfo;
                    }
                }
            });
        });
        return best;
    }, [shelves, bookCorner]);

    const getBookPriceModifier = useCallback((slot: SlotInfo): number => {
        let modifier = 1.0;
        if (slot.bookCondition) {
            const condition = BOOK_CONDITIONS.find(c => c.condition === slot.bookCondition);
            if (condition) modifier *= condition.priceModifier;
        }
        if (slot.isSigned) modifier *= 1.5;
        if (slot.hasPersonalNote) modifier *= 1.1;
        return modifier;
    }, []);

    const getProductPrice = useCallback((productId: string, specificSlot?: SlotInfo) => {
        const product = PRODUCTS.find(p => p.id === productId);
        if (!product) return 0;

        if (specificSlot) {
            if (specificSlot.shelfIndex === -1) {
                let price = product.basePrice;
                if (product.category === "books") {
                    price *= getBookPriceModifier(specificSlot);
                }
                return Math.round(price);
            }

            const shelf = shelves[specificSlot.shelfIndex];
            if (!shelf) return Math.round(product.basePrice);

            let price = product.basePrice * shelf.priceMultiplier;

            if (product.category === "books") {
                price *= getBookPriceModifier(specificSlot);
            }
            return Math.round(price);
        }

        if (product.category === "books") {
            for (let slotIdx = 0; slotIdx < bookCorner.length; slotIdx++) {
                const slot = bookCorner[slotIdx];
                if (slot && slot.productId === productId) {
                    let price = product.basePrice;
                    const slotInfo: SlotInfo = {
                        shelfIndex: -1,
                        slotIndex: slotIdx,
                        freshness: slot.freshness,
                        bookCondition: slot.bookCondition,
                        isSigned: slot.isSigned,
                        hasPersonalNote: slot.hasPersonalNote,
                        personalNote: slot.personalNote,
                        previousOwner: slot.previousOwner
                    };
                    price *= getBookPriceModifier(slotInfo);
                    return Math.round(price);
                }
            }
        }

        for (let shelfIdx = 0; shelfIdx < shelves.length; shelfIdx++) {
            const shelf = shelves[shelfIdx];
            for (let slotIdx = 0; slotIdx < shelf.slots.length; slotIdx++) {
                const slot = shelf.slots[slotIdx];
                if (slot && slot.productId === productId) {
                    let price = product.basePrice * shelf.priceMultiplier;

                    if (product.category === "books") {
                        const slotInfo: SlotInfo = {
                            shelfIndex: shelfIdx,
                            slotIndex: slotIdx,
                            freshness: slot.freshness,
                            bookCondition: slot.bookCondition,
                            isSigned: slot.isSigned,
                            hasPersonalNote: slot.hasPersonalNote,
                            personalNote: slot.personalNote,
                            previousOwner: slot.previousOwner
                        };
                        price *= getBookPriceModifier(slotInfo);
                    }
                    return Math.round(price);
                }
            }
        }
        return 0;
    }, [shelves, bookCorner, getBookPriceModifier]);

    useEffect(() => {
        if (shelves.length < shelfCount) {
            const newShelves = [...shelves];
            for (let i = shelves.length; i < shelfCount; i++) {
                newShelves.push({ slots: [null, null, null, null, null, null], priceMultiplier: 1.3 });
            }
            setShelves(newShelves);
        }
    }, [shelfCount, shelves]);

    const notify = useCallback((text: string, type: string = "info") => {
        const id = Math.random().toString(36).slice(2);
        setNotifications(prev => [...prev, { id, text, type }].slice(-5));
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    }, []);

    const unlockAchievement = useCallback((id: string) => {
        setAchievements(prev => {
            const achievement = prev.find(a => a.id === id);
            if (achievement && !achievement.unlocked) {
                setNewAchievement({ ...achievement, unlocked: true });
                setTimeout(() => setNewAchievement(null), 3000);
                return prev.map(a => a.id === id ? { ...a, unlocked: true } : a);
            }
            return prev;
        });
    }, []);

    useEffect(() => {
        if (totalSales > 0) unlockAchievement("first-sale");
        if (totalCustomersServed >= 100) unlockAchievement("100-sales");
        if (money >= 1000) unlockAchievement("1000-money");
        if (averageRating >= 4.9 && reviews.length >= 10) unlockAchievement("5-star");
        if (combosTriggered >= 10) unlockAchievement("combo-master");
        if (day >= 10) unlockAchievement("survivor");
        if (vipsServed >= 5) unlockAchievement("vip-service");
        if (thievesCaught > 0) unlockAchievement("catch-thief");
    }, [totalSales, totalCustomersServed, money, averageRating, reviews.length, combosTriggered, day, vipsServed, thievesCaught, unlockAchievement]);

    useEffect(() => {
        if (!isOpen || gameOver || currentEvent) return;

        const eventCheck = setInterval(() => {
            if (Math.random() < 0.005 && timeOfDay > 10 && timeOfDay < 80) {
                const events: Omit<GameEvent, "id" | "active">[] = [
                    { type: "rush-hour", message: "🏃 RUSH HOUR! More customers incoming!", duration: 200 },
                    { type: "supplier-deal", message: "📦 Supplier Deal! 30% off next order!", duration: 300 },
                    { type: "viral-review", message: "📱 You went viral! Customer surge!", duration: 250 },
                ];

                if (day > 3) {
                    events.push({ type: "health-inspector", message: "👨‍⚕️ Health Inspector! Fresh products only!", duration: 150 });
                }

                if (hasBookClub && Math.random() < 0.3) {
                    events.push({ type: "book-club", message: "📖 Book Club meeting! Book lovers arriving!", duration: 300 });
                }

                if (hasSigningTable && Math.random() < 0.2) {
                    events.push({ type: "author-signing", message: "✍️ Author Signing! Fans want signed books!", duration: 250 });
                }

                if (hasPoetryCorner && Math.random() < 0.25) {
                    events.push({ type: "poetry-night", message: "🎭 Poetry Night! Artists & dreamers are here!", duration: 280 });
                }

                const event = events[Math.floor(Math.random() * events.length)];
                setCurrentEvent({ ...event, id: Math.random().toString(36), active: true });
                notify(event.message, "event");
            }
        }, 5000);

        return () => clearInterval(eventCheck);
    }, [isOpen, gameOver, currentEvent, timeOfDay, day, notify, hasBookClub, hasSigningTable, hasPoetryCorner]);

    useEffect(() => {
        if (!currentEvent) return;
        const timeout = setTimeout(() => {
            setCurrentEvent(null);
        }, currentEvent.duration * 50);
        return () => clearTimeout(timeout);
    }, [currentEvent]);

    useEffect(() => {
        if (!isOpen || gameOver || isPaused) return;
        const interval = setInterval(() => {
            setTimeOfDay(t => Math.min(t + 1, 100));
        }, 600);
        return () => clearInterval(interval);
    }, [isOpen, gameOver, isPaused]);

    useEffect(() => {
        if (timeOfDay >= 100 && isOpen && customers.length === 0 && !activeCustomer) {
            setIsOpen(false);

            const teasers = [
                regulars.length > 0 && `${regulars[0].name} said they'd come by...`,
                day === 4 && `🎂 It's the shop's anniversary tomorrow!`,
                `New customers await on Day ${day + 1}!`,
            ].filter(Boolean) as string[];
            setTomorrowTeaser(teasers[0] || "What will tomorrow bring?");

            setShowDaySummary(true);
        }
    }, [timeOfDay, isOpen, customers.length, activeCustomer, regulars, day]);

    const decayFreshness = useCallback(() => {
        const decayRate = 1 - freshnessBonus;

        setShelves(prev => prev.map(shelf => {
            const newSlots = shelf.slots.map(slot => {
                if (!slot) return null;
                const product = PRODUCTS.find(p => p.id === slot.productId);
                if (!product) return slot;

                const decay = (100 / product.freshnessDays) * decayRate;
                const newFreshness = slot.freshness - decay;

                if (newFreshness <= 0) {
                    notify(`${product.emoji} ${product.name} expired on shelf!`, "warning");
                    return null;
                }
                return { ...slot, freshness: newFreshness };
            });
            return { ...shelf, slots: newSlots };
        }));

        setStorage(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(key => {
                const product = PRODUCTS.find(p => p.id === key);
                if (!product) return;

                const decay = (100 / product.freshnessDays) * decayRate;
                updated[key] = {
                    ...updated[key],
                    freshnessPercent: updated[key].freshnessPercent - decay,
                };

                if (updated[key].freshnessPercent <= 0) {
                    notify(`${product.emoji} ${product.name} expired in storage!`, "warning");
                    delete updated[key];
                }
            });
            return updated;
        });
    }, [freshnessBonus, notify]);

    const generateRequest = useCallback((customerType: Customer["type"], isRegularCustomer: boolean, regularData?: RegularCustomer): CustomerRequest => {
        const currentDay = dayRef.current;
        const stockedIds = getUniqueStockedProductIds();

        if (isRegularCustomer && regularData && regularData.visitCount > 2) {
            if (regularData.visitCount > 5) {
                return {
                    type: "regular",
                    text: "The usual, please!",
                    validProducts: regularData.favoriteProducts,
                    perfectProducts: regularData.favoriteProducts
                };
            } else {
                const favProduct = PRODUCTS.find(p => p.id === regularData.favoriteProducts[0]);
                return {
                    type: "regular",
                    text: `Hi again! Do you have any ${favProduct?.name || 'of my favorites'}?`,
                    validProducts: regularData.favoriteProducts,
                    perfectProducts: regularData.favoriteProducts
                };
            }
        }

        const currentEventType = currentEventRef.current?.type;

        if (currentEventType === "book-club" && (customerType === "bookworm" || Math.random() < 0.7)) {
            const template = BOOK_CLUB_REQUESTS[Math.floor(Math.random() * BOOK_CLUB_REQUESTS.length)];
            return { ...template };
        }

        if (currentEventType === "poetry-night" && (customerType === "writer" || Math.random() < 0.7)) {
            const template = POETRY_NIGHT_REQUESTS[Math.floor(Math.random() * POETRY_NIGHT_REQUESTS.length)];
            return { ...template };
        }

        if (currentEventType === "author-signing" && (customerType === "bookworm" || Math.random() < 0.7)) {
            const template = AUTHOR_SIGNING_REQUESTS[Math.floor(Math.random() * AUTHOR_SIGNING_REQUESTS.length)];
            return { ...template };
        }

        let availableTemplates = REQUEST_TEMPLATES.filter(t => {
            if (currentDay === 1) return t.type === "specific";
            if (currentDay === 2) return t.type === "specific" || t.type === "vague" || t.type === "list";
            return true; // unrestricted on day 3+
        });

        if (customerType === "vip") {
            availableTemplates = availableTemplates.filter(t => t.type !== "specific");
        }

        if (customerType === "bookworm") {
            const bookTemplates = availableTemplates.filter(t =>
                t.validProducts.some(p => ["mystery", "romance", "fantasy", "poetry", "classic", "selfhelp", "cookbook", "childrens"].includes(p))
            );
            if (bookTemplates.length > 0) {
                availableTemplates = bookTemplates;
            }
        }

        if (customerType === "writer") {
            const writerTemplates = availableTemplates.filter(t =>
                t.validProducts.some(p => ["journal", "poetry", "espresso", "latte", "candle"].includes(p))
            );
            if (writerTemplates.length > 0) {
                availableTemplates = writerTemplates;
            }
        }

        availableTemplates = availableTemplates.filter(t => {
            if (t.type === "recommendation") return stockedIds.length > 0;
            return t.validProducts.some(p => stockedIds.includes(p)) || t.validProducts.length === 0;
        });

        if (availableTemplates.length === 0) {
            const randomProduct = stockedIds[Math.floor(Math.random() * stockedIds.length)];
            const product = PRODUCTS.find(p => p.id === randomProduct);
            return {
                type: "specific",
                text: `Do you have any ${product?.name || 'products'}?`,
                validProducts: randomProduct ? [randomProduct] : PRODUCTS.map(p => p.id),
                perfectProducts: randomProduct ? [randomProduct] : []
            };
        }

        const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];

        if (template.type === "budget") {
            return { ...template, budget: 8 + Math.floor(Math.random() * 12) };
        }

        return template;
    }, [getUniqueStockedProductIds]);

    const startInteraction = useCallback((customer: Customer) => {
        const regularData = customer.isRegular && customer.regularId
            ? regulars.find(r => r.id === customer.regularId)
            : undefined;

        const request = generateRequest(customer.type, customer.isRegular || false, regularData);

        let initialSatisfaction = Math.round(50 * (1 + happinessBonus));
        if (customer.type === "vip") initialSatisfaction = Math.round(40 * (1 + happinessBonus));
        if (customer.type === "picky") initialSatisfaction = Math.round(35 * (1 + happinessBonus));
        if (customer.isRegular) initialSatisfaction = Math.round(60 * (1 + happinessBonus));

        setCustomers(prev => prev.map(c =>
            c.id === customer.id ? { ...c, state: "being-served" as const } : c
        ));

        setActiveCustomer({
            id: customer.id,
            avatar: customer.avatar,
            name: regularData?.name,
            request,
            offeredProducts: [],
            satisfaction: initialSatisfaction,
            isRegular: customer.isRegular || false,
            regularId: customer.regularId
        });

    }, [regulars, generateRequest, happinessBonus]);

    const offerProduct = useCallback((productId: string) => {
        if (!activeCustomer) return;

        const slot = getFreshestSlot(productId);
        if (!slot) {
            notify("Out of stock!", "warning");
            return;
        }

        const slotShelfIndex = slot.shelfIndex;
        const slotSlotIndex = slot.slotIndex;
        const slotFreshness = slot.freshness;
        const slotBookCondition = slot.bookCondition;
        const slotIsSigned = slot.isSigned;
        const slotPreviousOwner = slot.previousOwner;
        const slotHasPersonalNote = slot.hasPersonalNote;

        const product = PRODUCTS.find(p => p.id === productId);
        const isBook = product?.category === "books";
        const price = getProductPrice(productId, slot);

        setActiveCustomer(prev => {
            if (!prev) return null;

            const customerType = customers.find(c => c.id === prev.id)?.type;
            const isBulkBuyer = customerType === "bulk";
            const maxItems = isBulkBuyer ? 5 : prev.request.type === "list" ? 4 : 3;

            if (prev.offeredProducts.length >= maxItems) {
                notify("They look overwhelmed! Maybe that's enough...", "warning");
                return {
                    ...prev,
                    satisfaction: prev.satisfaction - 5,
                    currentResponse: "Whoa, that's a lot! I think I have enough now... 😅"
                };
            }

            let satisfactionChange: number = 0;
            let response: string = "";

            if (prev.request.budget) {
                const currentTotal = prev.offeredProducts.reduce((sum, item) => sum + item.price, 0);
                if (currentTotal + price > prev.request.budget) {
                    satisfactionChange = -25;
                    response = "I told you I can't afford that! 😤";
                    return {
                        ...prev,
                        satisfaction: Math.max(-100, Math.min(100, prev.satisfaction + satisfactionChange)),
                        currentResponse: response
                    };
                }
            }

            if (isBook) {
                setBooksSold(b => b + 1);

                if (slotIsSigned) {
                    setSignedBooksSold(s => s + 1);
                    satisfactionChange = 50;
                    const signedResponses = [
                        `A SIGNED copy?! By ${product?.author}?! 🤩`,
                        "Wait... is this SIGNED?! I can't believe it! ✨",
                        "A signed first edition... this is a treasure! 💎",
                        `${product?.author} signed this?! I'm shaking! 😭`,
                        "I'll treasure this forever! Thank you! 🥹"
                    ];
                    response = signedResponses[Math.floor(Math.random() * signedResponses.length)];
                }
                else if (slotBookCondition === "beloved") {
                    satisfactionChange = 40;
                    if (slotPreviousOwner) {
                        const belovedResponses = [
                            `This was owned by ${slotPreviousOwner}? I love books with history! 💝`,
                            `The margin notes from ${slotPreviousOwner} add so much! ✨`,
                            "These pressed flowers... someone really loved this book 🌸",
                            `A book that was truly loved... ${slotPreviousOwner} had great taste!`,
                            "The notes in the margins are like having a reading buddy! 📝"
                        ];
                        response = belovedResponses[Math.floor(Math.random() * belovedResponses.length)];
                    } else {
                        response = "This book has so much character! I love it! 💕";
                    }
                }
                else if (slotBookCondition === "mint") {
                    satisfactionChange = 30;
                    const mintResponses = [
                        "Brand new! The spine hasn't even been cracked! ✨",
                        "That new book smell... perfect condition! 📚",
                        "Pristine! This will look great on my shelf!",
                        "Mint condition, I love it! 🌟"
                    ];
                    response = mintResponses[Math.floor(Math.random() * mintResponses.length)];
                }
                else if (slotBookCondition === "worn") {
                    const customerType = customers.find(c => c.id === prev.id)?.type;
                    if (customerType === "bookworm" || customerType === "student") {
                        satisfactionChange = 15;
                        response = "Well-loved books are the best! Shows it's good! 📖";
                    } else if (customerType === "vip") {
                        satisfactionChange = -10;
                        response = "This is rather... worn. Don't you have a nicer copy? 🤨";
                    } else {
                        satisfactionChange = 10;
                        response = "A bit worn, but the story's the same, right? 😊";
                    }
                }
                else {
                    if (prev.request.perfectProducts.includes(productId)) {
                        satisfactionChange = 35;
                        const happyBookResponses = [
                            `${product?.name}! Exactly what I was looking for! 📚`,
                            `A ${product?.genre} book! Perfect! 📖`,
                            `I've heard amazing things about ${product?.author}! ✨`,
                            "This is the one I wanted! Thank you! 🎉"
                        ];
                        response = happyBookResponses[Math.floor(Math.random() * happyBookResponses.length)];
                    } else if (prev.request.validProducts.includes(productId)) {
                        satisfactionChange = 20;
                        response = "That looks like a good read! I'll take it! 📚";
                    } else if (prev.request.type === "recommendation") {
                        satisfactionChange = 25;
                        setRecommendedBooks(r => r + 1);
                        const recoResponses = [
                            "If you recommend it, I trust you! 🌟",
                            "Your personal pick? I'm intrigued! ✨",
                            "I love getting book recommendations! 📖"
                        ];
                        response = recoResponses[Math.floor(Math.random() * recoResponses.length)];
                    } else {
                        satisfactionChange = -15;
                        response = "Hmm, that's not quite what I had in mind... 📕";
                        return {
                            ...prev,
                            satisfaction: Math.max(-100, Math.min(100, prev.satisfaction + satisfactionChange)),
                            currentResponse: response
                        };
                    }
                }

                if (slotHasPersonalNote) {
                    satisfactionChange += 15;
                    response += " And you added a personal note - so thoughtful! 💌";
                }
            }
            else {
                if (prev.request.perfectProducts.includes(productId)) {
                    satisfactionChange = 35;
                    const happyResponses = ["Perfect! 😊", "Exactly what I needed!", "Yes! 🎉", "You read my mind!", "That's the one!"];
                    response = happyResponses[Math.floor(Math.random() * happyResponses.length)];
                } else if (prev.request.validProducts.includes(productId)) {
                    satisfactionChange = 15;
                    const okResponses = ["That works!", "Sure, I'll take it.", "Good enough!", "Okay~", "Not bad."];
                    response = okResponses[Math.floor(Math.random() * okResponses.length)];
                } else if (prev.request.type === "recommendation") {
                    if (slotFreshness > 80) {
                        satisfactionChange = 30;
                        response = "Ooh, this looks so fresh! 🌟";
                    } else if (slotFreshness > 60) {
                        satisfactionChange = 15;
                        response = "Looks decent!";
                    } else if (slotFreshness > 40) {
                        satisfactionChange = -5;
                        response = "Hmm, this has seen better days...";
                    } else {
                        satisfactionChange = -30;
                        response = "This is old! I asked for something FRESH! 😡";
                    }
                } else {
                    satisfactionChange = -25;
                    const disappointedResponses = [
                        "That's not what I asked for... 😕",
                        "Were you even listening?",
                        "No, that's wrong.",
                        "I don't need that at all.",
                        "Please pay attention to what I'm saying."
                    ];
                    response = disappointedResponses[Math.floor(Math.random() * disappointedResponses.length)];
                    return {
                        ...prev,
                        satisfaction: Math.max(-100, Math.min(100, prev.satisfaction + satisfactionChange)),
                        currentResponse: response
                    };
                }
            }

            if (slotShelfIndex === -1) {
                setBookCorner(prev => {
                    const updated = [...prev];
                    updated[slotSlotIndex] = null;
                    return updated;
                });
            } else {
                setShelves(s => {
                    const newShelves = [...s];
                    newShelves[slotShelfIndex] = {
                        ...newShelves[slotShelfIndex],
                        slots: newShelves[slotShelfIndex].slots.map((sl, idx) =>
                            idx === slotSlotIndex ? null : sl
                        )
                    };
                    return newShelves;
                });
            }

            return {
                ...prev,
                offeredProducts: [...prev.offeredProducts, { productId, price }],
                satisfaction: Math.max(-100, Math.min(100, prev.satisfaction +
                    (satisfactionChange > 0 ? Math.round(satisfactionChange * (1 + speedBonus)) : satisfactionChange)
                )),
                currentResponse: response
            };
        });

        setTimeout(() => {
            setActiveCustomer(prev => {
                if (!prev || prev.offeredProducts.length === 0) return prev;

                const offeredProductIds = prev.offeredProducts.map(item => item.productId);
                const gotEverything = prev.request.perfectProducts.length > 0 &&
                    prev.request.perfectProducts.every(p => offeredProductIds.includes(p));

                const isHappy = prev.satisfaction > 60;
                const hasEnoughItems = prev.offeredProducts.length >= 2;

                const customerType = customers.find(c => c.id === prev.id)?.type;
                const isBulkBuyer = customerType === "bulk";
                const isPicky = customerType === "picky";

                let shouldStopBrowsing = false;
                let finalMessage = "";

                if (gotEverything && isHappy) {
                    shouldStopBrowsing = true;
                    finalMessage = "Perfect! That's everything I need! 😊";
                } else if (isPicky && prev.satisfaction < 40 && prev.offeredProducts.length > 0) {
                    shouldStopBrowsing = true;
                    finalMessage = "Hmm... I think I'll just take what you showed me. 😐";
                } else if (!isBulkBuyer && hasEnoughItems && isHappy) {
                    shouldStopBrowsing = true;
                    finalMessage = "That's plenty for me, thanks! 🙂";
                } else if (prev.request.type === "specific" && gotEverything) {
                    shouldStopBrowsing = true;
                    finalMessage = "Got it! That's all I needed. ✓";
                }

                if (shouldStopBrowsing) {
                    return {
                        ...prev,
                        currentResponse: finalMessage,
                        satisfaction: prev.satisfaction + 5
                    };
                }

                return prev;
            });
        }, 800);
    }, [activeCustomer, customers, getFreshestSlot, getProductPrice, notify]);

    const finishInteraction = useCallback((completed: boolean) => {
        if (!activeCustomer) return;

        if (completed && activeCustomer.offeredProducts.length > 0) {
            const total = activeCustomer.offeredProducts.reduce((sum, item) => sum + item.price, 0);

            const offeredProductIds = activeCustomer.offeredProducts.map(item => item.productId);

            let comboBonus = 0;
            let comboName = "";
            for (const combo of COMBOS) {
                const hasAll = combo.products.every(p => offeredProductIds.includes(p));
                if (hasAll) {
                    comboBonus += combo.bonus;
                    comboName = combo.name;
                    setCombosTriggered(c => c + 1);
                }
            }

            let eventBonus = 0;
            let eventBonusMessage = "";
            const eventType = currentEvent?.type;

            if (eventType === "book-club") {
                const booksSold = offeredProductIds.filter(id =>
                    ["mystery", "romance", "fantasy", "poetry", "classic", "selfhelp", "cookbook", "childrens"].includes(id)
                ).length;
                if (booksSold > 0) {
                    eventBonus = booksSold * 3;
                    eventBonusMessage = `📖 Book Club Bonus! +$${eventBonus}`;
                }
            }

            if (eventType === "poetry-night") {
                const poeticItems = offeredProductIds.filter(id =>
                    ["poetry", "journal", "candle"].includes(id)
                ).length;
                if (poeticItems > 0) {
                    eventBonus = poeticItems * 4;
                    eventBonusMessage = `🎭 Poetry Night Bonus! +$${eventBonus}`;
                }
            }

            if (eventType === "author-signing") {
                const booksSold = offeredProductIds.filter(id =>
                    ["mystery", "romance", "fantasy", "poetry", "classic", "selfhelp", "cookbook", "childrens"].includes(id)
                ).length;
                if (booksSold > 0) {
                    eventBonus = booksSold * 5;
                    eventBonusMessage = `✍️ Signing Event Bonus! +$${eventBonus}`;
                    setReputation(r => Math.min(100, r + 2));
                }
            }

            const finalTotal = total + comboBonus + eventBonus;

            setMoney(m => m + finalTotal);
            setDailySales(d => d + finalTotal);
            setTotalSales(t => t + finalTotal);
            setTotalCustomersServed(c => c + 1);

            const isPerfect = activeCustomer.request.perfectProducts.length > 0 &&
                activeCustomer.request.perfectProducts.every(p => offeredProductIds.includes(p));
            if (isPerfect) {
                setPerfectServings(p => p + 1);
            }

            if (eventBonus > 0) {
                notify(eventBonusMessage, "success");
            }
            if (comboBonus > 0) {
                notify(`🎯 ${comboName}! +$${finalTotal}`, "success");
            } else if (eventBonus === 0) {
                notify(`💵 Sale! +$${finalTotal}`, "success");
            }

            const rating = activeCustomer.satisfaction > 70 ? 4 + Math.random() :
                          activeCustomer.satisfaction > 40 ? 2.5 + Math.random() * 1.5 :
                          1 + Math.random();
            const reviewTexts = activeCustomer.satisfaction > 70
                ? ["Great service!", "Found what I needed!", "Will come back!"]
                : activeCustomer.satisfaction > 40
                ? ["It was okay.", "Decent.", "Could be better."]
                : ["Not great.", "Disappointed.", "Wrong items."];

            setReviews(prev => [{
                rating,
                text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
                avatar: activeCustomer.avatar
            }, ...prev.slice(0, 49)]);

            if (activeCustomer.satisfaction > 70 && !activeCustomer.isRegular && Math.random() < 0.25) {
                const name = REGULAR_NAMES[Math.floor(Math.random() * REGULAR_NAMES.length)];
                if (!regulars.find(r => r.name === name)) {
                    setRegulars(prev => [...prev, {
                        id: Math.random().toString(36).slice(2),
                        name,
                        avatar: activeCustomer.avatar,
                        visitCount: 1,
                        favoriteProducts: offeredProductIds.slice(0, 2),
                        relationship: 30,
                        notes: [],
                        lastVisit: day,
                        totalSpent: finalTotal
                    }]);
                    notify(`⭐ ${name} is now a regular!`, "success");
                }
            }

            if (activeCustomer.isRegular && activeCustomer.regularId) {
                setRegulars(prev => prev.map(r => {
                    if (r.id === activeCustomer.regularId) {
                        return {
                            ...r,
                            visitCount: r.visitCount + 1,
                            relationship: Math.min(100, r.relationship + (activeCustomer.satisfaction > 60 ? 10 : -5)),
                            lastVisit: day,
                            totalSpent: r.totalSpent + finalTotal
                        };
                    }
                    return r;
                }));
                setRegularsServed(r => r + 1);
            }

            if (customers.find(c => c.id === activeCustomer.id)?.type === "vip") {
                setVipsServed(v => v + 1);
            }
        } else {
            setReviews(prev => [{
                rating: 1 + Math.random(),
                text: "Couldn't find what I needed.",
                avatar: activeCustomer.avatar
            }, ...prev.slice(0, 49)]);
        }

        setCustomers(prev => prev.map(c =>
            c.id === activeCustomer.id
                ? { ...c, state: "leaving" as const }
                : c
        ));

        setActiveCustomer(null);
    }, [activeCustomer, getProductPrice, day, regulars, customers, notify, currentEvent]);

    useEffect(() => {
        if (!isOpen || gameOver || isPaused) return;

        const interval = setInterval(() => {
            const currentTime = timeOfDayRef.current;
            if (currentTime >= 90) return;

            const event = currentEventRef.current;
            const isRushHour = event?.type === "rush-hour" || event?.type === "viral-review" || (currentTime > 30 && currentTime < 50);
            const isSpecialEvent = event?.type === "book-club" || event?.type === "poetry-night" || event?.type === "author-signing";

            const baseChance = 0.2 + (averageRating / 25) + customerBonus;
            const spawnChance = isRushHour ? baseChance * 1.5 : isSpecialEvent ? baseChance * 1.3 : baseChance;

            const currentCustomers = customersRef.current;
            const currentRegulars = regularsRef.current;
            const hasActiveCustomer = activeCustomerRef.current !== null;

            const baseMaxWaiting = isRushHour ? 4 : isSpecialEvent ? 3 : 2;
            const maxWaiting = baseMaxWaiting + capacityBonus;

            if (currentCustomers.length < maxWaiting && !hasActiveCustomer && Math.random() < spawnChance) {
                let isRegularVisit = false;
                let regularData: RegularCustomer | undefined;

                if (currentRegulars.length > 0 && Math.random() < 0.3) {
                    const eligibleRegulars = currentRegulars.filter(r => r.lastVisit < dayRef.current);
                    if (eligibleRegulars.length > 0) {
                        regularData = eligibleRegulars[Math.floor(Math.random() * eligibleRegulars.length)];
                        isRegularVisit = true;
                    }
                }

                let type: Customer["type"] = "normal";
                const roll = Math.random();

                if (!isRegularVisit) {
                    if (roll < 0.05 + (vipBonus ? 0.1 : 0)) type = "vip";
                    else if (roll < 0.10) type = "bulk";
                    else if (roll < 0.15) type = "picky";
                    else if (roll < 0.08 && dayRef.current > 2) type = "thief";
                }

                const avatar = isRegularVisit && regularData
                    ? regularData.avatar
                    : type === "vip"
                        ? VIP_AVATARS[Math.floor(Math.random() * VIP_AVATARS.length)]
                        : type === "thief"
                            ? THIEF_AVATARS[Math.floor(Math.random() * THIEF_AVATARS.length)]
                            : CUSTOMER_AVATARS[Math.floor(Math.random() * CUSTOMER_AVATARS.length)];

                const basePatience = type === "vip" ? 80 : type === "picky" ? 60 : 100;
                const maxPatience = Math.round(basePatience * (1 + patienceBonus));

                const newCustomer: Customer = {
                    id: Math.random().toString(36).slice(2),
                    x: -50,
                    y: 0,
                    state: "entering",
                    patience: maxPatience,
                    maxPatience,
                    cart: [],
                    avatar,
                    type: isRegularVisit ? "normal" : type,
                    serveProgress: 0,
                    isRegular: isRegularVisit,
                    regularId: regularData?.id
                };

                setCustomers(prev => [...prev, newCustomer]);
                setDailyCustomers(c => c + 1);
            }
        }, 1200);

        return () => clearInterval(interval);
    }, [isOpen, gameOver, isPaused, averageRating, customerBonus, vipBonus, patienceBonus, capacityBonus]);

    useEffect(() => {
        if (!isOpen || gameOver || isPaused || currentDilemma) return;

        const interval = setInterval(() => {
            if (Math.random() < 0.01 && dayRef.current > 1 && timeOfDayRef.current > 20 && timeOfDayRef.current < 80) {
                const template = DILEMMA_TEMPLATES[Math.floor(Math.random() * DILEMMA_TEMPLATES.length)];
                setCurrentDilemma({
                    ...template,
                    id: Math.random().toString(36).slice(2),
                    choiceEffects: []
                });
                setIsPaused(true);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [isOpen, gameOver, isPaused, currentDilemma]);

    const resolveDilemma = useCallback((choiceIndex: number) => {
        if (!currentDilemma) return;

        const choice = currentDilemma.choices[choiceIndex];
        setDilemmaResult(choice.consequence);

        if (choiceIndex === 0) {
            if (currentDilemma.situation.includes("$1 short")) {
                setMoney(m => m - 1);
                setReputation(r => Math.min(100, r + 10));
            } else if (currentDilemma.situation.includes("forgot her wallet")) {
                setReputation(r => Math.min(100, r + 5));
            } else if (currentDilemma.situation.includes("2x markup")) {
                setReputation(r => Math.min(100, r + 15));
            } else if (currentDilemma.situation.includes("desperate")) {
                setMoney(m => m - 10);
                setReputation(r => Math.min(100, r + 20));
            } else if (currentDilemma.situation.includes("shoplifting")) {
                setReputation(r => Math.min(100, r + 5));
            } else if (currentDilemma.situation.includes("bribe")) {
                setMoney(m => m - 50);
            }
        } else {
            if (currentDilemma.situation.includes("forgot her wallet")) {
                setReputation(r => Math.max(0, r - 10));
            } else if (currentDilemma.situation.includes("2x markup")) {
                const cheeseCount = shelves.reduce((count, shelf) =>
                    count + shelf.slots.filter(s => s?.productId === "cheese").length, 0
                );
                setMoney(m => m + cheeseCount * 16);
                setShelves(prev => prev.map(shelf => ({
                    ...shelf,
                    slots: shelf.slots.map(slot =>
                        slot?.productId === "cheese" ? null : slot
                    )
                })));
            } else if (currentDilemma.situation.includes("bribe")) {
                setReputation(r => Math.min(100, r + 25));
            }
        }

        setTimeout(() => {
            setCurrentDilemma(null);
            setDilemmaResult(null);
            setIsPaused(false);
        }, 2500);
    }, [currentDilemma, shelves]);

    useEffect(() => {
        if (gameOver) return;

        const gameLoop = setInterval(() => {
            const hasActiveCustomer = activeCustomerRef.current !== null;

            setCustomers(prev => {
                const updated: Customer[] = [];
                let shouldTriggerInteraction: Customer | null = null;

                for (const c of prev) {
                    const customer = { ...c };

                    switch (customer.state) {
                        case "entering":
                            customer.x = Math.min(customer.x + 6, 180);
                            if (customer.x >= 180) {
                                customer.state = "waiting-at-counter";

                                if (!hasActiveCustomer && !shouldTriggerInteraction) {
                                    const othersWaiting = prev.filter(p =>
                                        p.id !== customer.id &&
                                        (p.state === "waiting-at-counter" || p.state === "being-served")
                                    );
                                    if (othersWaiting.length === 0) {
                                        shouldTriggerInteraction = customer;
                                    }
                                }
                            }
                            break;

                        case "being-served":
                            break;

                        case "waiting-at-counter":
                            const patienceDecay = customer.type === "vip" ? 0.5 :
                                                  customer.isRegular ? 0.4 : 0.3;
                            customer.patience -= patienceDecay;

                            if (!hasActiveCustomer && !shouldTriggerInteraction) {
                                const beingServed = prev.filter(p => p.state === "being-served");
                                const waitingBefore = prev.filter(p =>
                                    p.id !== customer.id &&
                                    p.state === "waiting-at-counter" &&
                                    p.x >= customer.x
                                );
                                if (beingServed.length === 0 && waitingBefore.length === 0) {
                                    shouldTriggerInteraction = customer;
                                }
                            }

                            if (customer.patience <= 0) {
                                customer.state = "angry-leaving";
                                const who = customer.isRegular ? "A regular customer" :
                                           customer.type === "vip" ? "A VIP" : "A customer";
                                notify(`😤 ${who} got tired of waiting and left!`, "warning");

                                if (customer.isRegular && customer.regularId) {
                                    setRegulars(r => r.map(reg =>
                                        reg.id === customer.regularId
                                            ? { ...reg, relationship: Math.max(0, reg.relationship - 15) }
                                            : reg
                                    ));
                                }
                            }
                            break;

                        case "angry-leaving":
                            customer.x += 12;
                            if (customer.x > 400) {
                                setReviews(r => [{
                                    rating: 1,
                                    text: "Waited forever! Terrible service!",
                                    avatar: customer.avatar
                                }, ...r.slice(0, 49)]);
                                continue;
                            }
                            break;

                        case "leaving":
                            customer.x += 10;
                            if (customer.x > 400) {
                                continue;
                            }
                            break;

                        case "stealing":
                            customer.x += 8;
                            if (customer.x > 400) {
                                const stolenTotal = customer.cart.reduce((sum, item) => sum + item.price, 0);
                                setStolenValue(v => v + stolenTotal);
                                notify(`🚨 Thief got away with $${stolenTotal}!`, "danger");
                                continue;
                            }
                            if (hasCamera && Math.random() < 0.05) {
                                customer.caught = true;
                                customer.state = "angry-leaving";
                                setThievesCaught(t => t + 1);
                                notify("📹 Security caught a shoplifter!", "success");
                            }
                            break;
                    }

                    updated.push(customer);
                }

                if (shouldTriggerInteraction && !hasActiveCustomer) {
                    setTimeout(() => {
                        const cust = shouldTriggerInteraction;
                        if (cust) {
                          startInteraction(cust);
                        }
                    }, 100);
                }

                return updated;
            });

        }, 100);

        return () => clearInterval(gameLoop);
    }, [gameOver, hasCamera, notify, isPaused]);

    const catchThief = useCallback((thiefId: string) => {
        setCustomers(prev => prev.map(c => {
            if (c.id === thiefId && c.state === "stealing") {
                setThievesCaught(t => t + 1);
                notify("🚔 You caught the thief!", "success");
                return { ...c, caught: true, state: "angry-leaving" as const, cart: [] };
            }
            return c;
        }));
    }, [notify]);

    const stockShelfSlot = useCallback((shelfIndex: number, slotIndex: number) => {
        if (!selectedProduct) return;

        const storageItem = storage[selectedProduct];
        if (!storageItem || storageItem.quantity <= 0) {
            notify("Nothing in storage!", "warning");
            return;
        }

        const shelf = shelves[shelfIndex];
        const slot = shelf.slots[slotIndex];

        if (slot !== null) {
            notify("Slot is occupied!", "warning");
            return;
        }

        const product = PRODUCTS.find(p => p.id === selectedProduct);
        const isBook = product?.category === "books";

        let bookProps: Partial<ShelfSlot> = {};
        if (isBook) {
            const conditionRoll = Math.random();
            const condition: "mint" | "good" | "worn" | "beloved" =
                conditionRoll < 0.3 ? "mint" :
                conditionRoll < 0.7 ? "good" :
                conditionRoll < 0.9 ? "worn" : "beloved";

            const isSigned = Math.random() < 0.1;

            const hasPreviousOwner = Math.random() < 0.2;

            bookProps = {
                bookCondition: condition,
                isSigned,
                previousOwner: hasPreviousOwner
                    ? PREVIOUS_OWNERS[Math.floor(Math.random() * PREVIOUS_OWNERS.length)]
                    : undefined,
            };

            if (isSigned) {
                notify(`✨ Signed copy of ${product.name}!`, "success");
            } else if (condition === "beloved") {
                notify(`💝 This ${product.name} is full of memories!`, "success");
            }
        }

        setStorage(s => ({
            ...s,
            [selectedProduct]: {
                ...s[selectedProduct],
                quantity: s[selectedProduct].quantity - 1
            }
        }));

        setShelves(s => {
            const updated = [...s];
            const newSlots = [...updated[shelfIndex].slots];
            newSlots[slotIndex] = {
                productId: selectedProduct,
                freshness: storageItem.freshnessPercent,
                placedAt: day,
                ...bookProps
            };
            updated[shelfIndex] = { ...updated[shelfIndex], slots: newSlots };
            return updated;
        });

        if (storageItem.quantity <= 1) {
            setSelectedProduct(null);
        }

        notify(`📦 Stocked ${PRODUCTS.find(p => p.id === selectedProduct)?.emoji}!`, "success");
    }, [selectedProduct, storage, shelves, day, notify]);

    const stockBookCorner = useCallback((slotIndex: number) => {
        if (!selectedProduct) return;

        const product = PRODUCTS.find(p => p.id === selectedProduct);
        if (product?.category !== "books") {
            notify("Only books go in the Book Corner! 📚", "warning");
            return;
        }

        const storageItem = storage[selectedProduct];
        if (!storageItem || storageItem.quantity <= 0) {
            notify("No books in storage!", "warning");
            return;
        }

        if (bookCorner[slotIndex] !== null) {
            notify("This display spot is taken!", "warning");
            return;
        }

        const conditionRoll = Math.random();
        const condition: "mint" | "good" | "worn" | "beloved" =
            conditionRoll < 0.3 ? "mint" :
            conditionRoll < 0.7 ? "good" :
            conditionRoll < 0.9 ? "worn" : "beloved";

        const isSigned = Math.random() < 0.1;

        const hasPreviousOwner = Math.random() < 0.2;

        const bookSlot: ShelfSlot = {
            productId: selectedProduct,
            freshness: 100,
            placedAt: day,
            bookCondition: condition,
            isSigned,
            previousOwner: hasPreviousOwner
                ? PREVIOUS_OWNERS[Math.floor(Math.random() * PREVIOUS_OWNERS.length)]
                : undefined,
        };

        setStorage(s => ({
            ...s,
            [selectedProduct]: {
                ...s[selectedProduct],
                quantity: s[selectedProduct].quantity - 1
            }
        }));

        setBookCorner(prev => {
            const updated = [...prev];
            updated[slotIndex] = bookSlot;
            return updated;
        });

        if (isSigned) {
            notify(`✨ Signed ${product.name} displayed!`, "success");
        } else if (condition === "beloved") {
            notify(`💝 ${product.name} with history displayed!`, "success");
        } else {
            notify(`📚 ${product.name} added to Book Corner!`, "success");
        }

        if (storageItem.quantity <= 1) {
            setSelectedProduct(null);
        }
    }, [selectedProduct, storage, bookCorner, day, notify]);

    const removeFromBookCorner = useCallback((slotIndex: number) => {
        const slot = bookCorner[slotIndex];
        if (!slot) return;

        setStorage(s => ({
            ...s,
            [slot.productId]: {
                productId: slot.productId,
                quantity: (s[slot.productId]?.quantity || 0) + 1,
                freshnessPercent: 100
            }
        }));

        setBookCorner(prev => {
            const updated = [...prev];
            updated[slotIndex] = null;
            return updated;
        });

        notify("Book returned to storage", "info");
    }, [bookCorner, notify]);

    const removeFromShelf = useCallback((shelfIndex: number, slotIndex: number) => {
        const shelf = shelves[shelfIndex];
        const slot = shelf.slots[slotIndex];
        if (!slot) return;

        setStorage(s => ({
            ...s,
            [slot.productId]: {
                productId: slot.productId,
                quantity: (s[slot.productId]?.quantity || 0) + 1,
                freshnessPercent: slot.freshness
            }
        }));

        setShelves(s => {
            const updated = [...s];
            const newSlots = [...updated[shelfIndex].slots];
            newSlots[slotIndex] = null;
            updated[shelfIndex] = { ...updated[shelfIndex], slots: newSlots };
            return updated;
        });

        notify("Returned to storage", "info");
    }, [shelves, notify]);

    const addPersonalNoteToBook = useCallback((shelfIndex: number, slotIndex: number) => {
        const shelf = shelves[shelfIndex];
        const slot = shelf.slots[slotIndex];
        if (!slot) return;

        const product = PRODUCTS.find(p => p.id === slot.productId);
        if (product?.category !== "books") {
            notify("You can only add notes to books!", "warning");
            return;
        }

        if (slot.hasPersonalNote) {
            notify("This book already has your recommendation!", "info");
            return;
        }

        const note = PERSONAL_NOTES[Math.floor(Math.random() * PERSONAL_NOTES.length)];

        setShelves(s => {
            const updated = [...s];
            const newSlots = [...updated[shelfIndex].slots];
            if (newSlots[slotIndex]) {
                newSlots[slotIndex] = {
                    ...newSlots[slotIndex]!,
                    hasPersonalNote: true,
                    personalNote: note
                };
            }
            updated[shelfIndex] = { ...updated[shelfIndex], slots: newSlots };
            return updated;
        });

        notify(`📝 Added note: "${note}"`, "success");
    }, [shelves, notify]);

    const maxStorageCapacity = Math.round(20 * (1 + storageBonus));

    const placeOrder = () => {
        const discount = currentEvent?.type === "supplier-deal" ? 0.7 : 1;
        const total = Math.round(Object.entries(cart).reduce(
            (sum, [id, qty]) => sum + (PRODUCTS.find(p => p.id === id)?.cost || 0) * qty * discount,
            0
        ));

        if (total > money) return;

        const currentStorageCount = Object.values(storage).reduce((a, b) => a + b.quantity, 0);
        const cartQuantity = Object.values(cart).reduce((a, b) => a + b, 0);
        if (currentStorageCount + cartQuantity > maxStorageCapacity) {
            notify(`📦 Storage full! Max capacity: ${maxStorageCapacity}`, "warning");
            return;
        }

        setMoney(m => m - total);
        setStorage(s => {
            const updated = { ...s };
            Object.entries(cart).forEach(([id, qty]) => {
                if (updated[id]) {
                    updated[id] = {
                        ...updated[id],
                        quantity: updated[id].quantity + qty
                    };
                } else {
                    updated[id] = {
                        productId: id,
                        quantity: qty,
                        freshnessPercent: 100
                    };
                }
            });
            return updated;
        });
        setCart({});
        setShowTablet(false);
        setIsPaused(false);
        notify("📦 Order delivered!", "success");
    };

    const purchaseUpgrade = (upgradeId: string) => {
        const upgrade = upgrades.find(u => u.id === upgradeId);
        if (!upgrade || upgrade.purchased || money < upgrade.cost) return;

        setMoney(m => m - upgrade.cost);
        setUpgrades(prev => prev.map(u => u.id === upgradeId ? { ...u, purchased: true } : u));
        notify(`${upgrade.emoji} ${upgrade.name} purchased!`, "success");
    };

    const updatePrice = (shelfIndex: number, multiplier: number) => {
        setShelves(prev => {
            const updated = [...prev];
            if (updated[shelfIndex]) {
                updated[shelfIndex] = { ...updated[shelfIndex]!, priceMultiplier: multiplier };
            }
            return updated;
        });
    };

    const openShop = () => {
        setIsPrepTime(false);
        setIsOpen(true);
        notify("🏪 Shop is now open! Customers incoming...", "success");
    };

    const payRentAndNextDay = () => {
        const totalOwed = rent + debt;
        if (money >= totalOwed) {
            setMoney(m => m - totalOwed);
            setDebt(0);
        } else {
            const newDebt = totalOwed - money;
            setMoney(0);
            setDebt(newDebt);
            if (newDebt > 150) {
                setGameOver(true);
                return;
            }
        }

        decayFreshness();
        setDay(d => d + 1);
        setTimeOfDay(0);
        setDailySales(0);
        setDailyCustomers(0);
        setIsOpen(false);
        setIsPrepTime(true);
        setShowDaySummary(false);
        setCurrentEvent(null);
    };

    const restartGame = () => {
        setMoney(150);
        setStorage({});
        setShelves([
            { slots: [null, null, null, null, null, null], priceMultiplier: 1.3 },
            { slots: [null, null, null, null, null, null], priceMultiplier: 1.3 },
            { slots: [null, null, null, null, null, null], priceMultiplier: 1.3 },
            { slots: [null, null, null, null, null, null], priceMultiplier: 1.3 },
        ]);
        setCustomers([]);
        setActiveCustomer(null);
        setRegulars([]);
        setCurrentDilemma(null);
        setReputation(50);
        setDay(1);
        setTimeOfDay(0);
        setIsOpen(false);
        setIsPrepTime(true);
        setDailySales(0);
        setDailyCustomers(0);
        setTotalSales(0);
        setTotalCustomersServed(0);
        setCombosTriggered(0);
        setVipsServed(0);
        setThievesCaught(0);
        setStolenValue(0);
        setRegularsServed(0);
        setPerfectServings(0);
        setDebt(0);
        setReviews([]);
        setUpgrades(INITIAL_UPGRADES);
        setAchievements(ACHIEVEMENTS);
        setIsOpen(true);
        setShowDaySummary(false);
        setGameOver(false);
        setCurrentEvent(null);
        setIsPaused(false);
    };

    const waitingCustomer = customers.find(c => c.state === "waiting-at-counter");

    const totalShelfItems = shelves.reduce((sum, shelf) =>
        sum + shelf.slots.filter(s => s !== null).length, 0
    );

    const cartTotal = Object.entries(cart).reduce(
        (sum, [id, qty]) => sum + (PRODUCTS.find(p => p.id === id)?.cost || 0) * qty,
        0
    );

    const discountedTotal = currentEvent?.type === "supplier-deal"
        ? Math.round(cartTotal * 0.7)
        : cartTotal;

    const storageCount = Object.values(storage).reduce((a, b) => a + b.quantity, 0);

    const renderStars = (rating: number) => (
        <span className="text-yellow-400 drop-shadow">
            {"★".repeat(Math.floor(rating))}
            {rating % 1 >= 0.5 && "½"}
            {"☆".repeat(5 - Math.ceil(rating))}
        </span>
    );

    const isRushHour = currentEvent?.type === "rush-hour" || currentEvent?.type === "viral-review" || (timeOfDay > 30 && timeOfDay < 50);

    const timeColors = {
        morning: {
            accent: 'from-amber-400/80 to-orange-500/80',
            text: 'text-amber-900',
            glow: 'shadow-amber-500/20',
            image: '/backgrounds/shop_day.jpg',
            overlay: 'bg-gradient-to-b from-amber-900/40 via-amber-800/20 to-amber-900/50',
            cardBg: 'bg-amber-950/60',
        },
        afternoon: {
            accent: 'from-sky-400/80 to-blue-500/80',
            text: 'text-blue-900',
            glow: 'shadow-blue-500/20',
            image: '/backgrounds/shop_afternoon.jpg',
            overlay: 'bg-gradient-to-b from-slate-900/40 via-slate-800/20 to-slate-900/50',
            cardBg: 'bg-slate-950/60',
        },
        evening: {
            accent: 'from-purple-500/80 to-indigo-600/80',
            text: 'text-purple-100',
            glow: 'shadow-purple-500/30',
            image: '/backgrounds/shop_evening.jpg',
            overlay: 'bg-gradient-to-b from-indigo-950/30 via-purple-900/10 to-indigo-950/40',
            cardBg: 'bg-indigo-950/50',
        },
    }[timePeriod];


    return (
        <div
            className={`h-screen w-full bg-cover bg-center transition-all duration-1000 flex flex-col overflow-hidden relative`}
            style={{ backgroundImage: `url('${timeColors.image}')` }}
        >
            <div className={`absolute inset-0 ${timeColors.overlay} pointer-events-none`} />

            <div className="relative z-10 flex flex-col gap-4 p-4 h-full">
            {newAchievement && (
                <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <GlassCard className="px-6 py-4 text-center animate-bounce">
                        <div className="text-4xl mb-2">{newAchievement.emoji}</div>
                        <div className="font-bold text-white">Achievement Unlocked!</div>
                        <div className="text-white/80">{newAchievement.name}</div>
                    </GlassCard>
                </div>
            )}

            <div className="flex gap-4 shrink-0 h-24">
                <GlassCard className="flex-[2] p-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white drop-shadow flex items-center gap-3">
                            Day {day}
                            {currentEvent && (
                                <span className={`text-sm bg-gradient-to-r ${
                                    currentEvent.type === "book-club" ? "from-amber-500/80 to-orange-600/80" :
                                    currentEvent.type === "poetry-night" ? "from-purple-500/80 to-pink-500/80" :
                                    currentEvent.type === "author-signing" ? "from-yellow-400/80 to-amber-500/80" :
                                    timeColors.accent
                                } px-3 py-1 rounded-full animate-pulse`}>
                                    {currentEvent.type === "rush-hour" ? "🏃 RUSH HOUR" :
                                        currentEvent.type === "supplier-deal" ? "📦 SUPPLIER SALE" :
                                        currentEvent.type === "viral-review" ? "📱 VIRAL ON SOCIALS" :
                                        currentEvent.type === "health-inspector" ? "👨‍⚕️ INSPECTION" :
                                        currentEvent.type === "book-club" ? "📖 BOOK CLUB" :
                                        currentEvent.type === "poetry-night" ? "🎭 POETRY NIGHT" :
                                        currentEvent.type === "author-signing" ? "✍️ AUTHOR SIGNING" : ""}
                                </span>
                            )}
                        </h1>
                        <div className="text-white/80 mt-1 flex items-center gap-4">
                            <span>{isPrepTime ? "Preparation Time" : timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}</span>
                            {isRushHour && !currentEvent && !isPrepTime && <span className="text-orange-300 font-bold">🏃 Rush Hour!</span>}
                        </div>
                    </div>

                    <div className="flex-1 mx-8">
                        {isPrepTime ? (
                            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30 text-center">
                                <span className="text-blue-300 text-sm font-medium">take your time to prepare!</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🌅</span>
                                <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden relative">
                                    <div
                                        className={`h-full transition-all bg-gradient-to-r ${
                                            isRushHour ? "from-red-400 to-orange-400" : "from-yellow-400 via-orange-400 to-purple-500"
                                        }`}
                                        style={{ width: `${timeOfDay}%` }}
                                    />
                                </div>
                                <span className="text-xl">🌙</span>
                                <button
                                    onClick={() => setIsPaused(!isPaused)}
                                    className="text-sm px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
                                >
                                    {isPaused ? "▶️" : "⏸️"}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-right min-w-[150px]">
                        <div className="text-3xl font-bold text-green-400 drop-shadow">${money}</div>
                        <div className="flex justify-end gap-3 text-sm mt-1">
                            <span className="text-yellow-400">Rep: {reputation}</span>
                            <span className="text-white/60">Rent: ${rent}</span>
                        </div>
                        {debt > 0 && <div className="text-xs text-red-400 font-bold mt-1">Debt: ${debt}</div>}
                    </div>
                </GlassCard>

                <GlassCard className="flex-1 p-4 flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-white/60">Sales</span>
                            <span className="text-green-400 font-bold">${dailySales}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/60">Visitors</span>
                            <span className="text-white font-bold">{dailyCustomers}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/60">Combos</span>
                            <span className="text-purple-400 font-bold">{combosTriggered}</span>
                        </div>
                        <div className="flex justify-between cursor-pointer hover:text-white transition" onClick={() => setShowReviews(true)}>
                            <span className="text-white/60">Rating</span>
                            <span className="text-yellow-400 font-bold">{averageRating.toFixed(1)} ★</span>
                        </div>
                    </div>

                    {(speedBonus > 0 || freshnessBonus > 0 || customerBonus > 0 || patienceBonus > 0 || hasCat) && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/10">
                            {speedBonus > 0 && <span className="text-xs bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">⚡+{Math.round(speedBonus * 100)}%</span>}
                            {freshnessBonus > 0 && <span className="text-xs bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded">❄️+{Math.round(freshnessBonus * 100)}%</span>}
                            {customerBonus > 0 && <span className="text-xs bg-green-500/30 text-green-300 px-1.5 py-0.5 rounded">👥+{Math.round(customerBonus * 100)}%</span>}
                            {patienceBonus > 0 && <span className="text-xs bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded">😌+{Math.round(patienceBonus * 100)}%</span>}
                            {hasCat && <span className="text-xs bg-orange-500/30 text-orange-300 px-1.5 py-0.5 rounded">🐱</span>}
                        </div>
                    )}
                </GlassCard>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">

                <div className="flex-[3] flex flex-col gap-4 min-w-0">

                    <GlassCard dark className="h-40 relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                        <div className="absolute bottom-2 left-3 text-xs opacity-60 font-mono">🚪 ENTRANCE</div>
                        <div className="absolute bottom-2 right-3 text-xs opacity-60 font-mono">🛒 COUNTER</div>

                        {waitingCustomer && !activeCustomer && (
                            <div className="absolute top-3 right-4 z-10">
                                <button
                                    onClick={() => startInteraction(waitingCustomer)}
                                    className={`flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse hover:scale-105 transition`}
                                >
                                    <span>🔔 Customer Waiting!</span>
                                    <span className="bg-white/20 px-2 rounded text-sm">Serve</span>
                                </button>
                            </div>
                        )}

                        {customers.map(c => (
                            <div
                                key={c.id}
                                onClick={() => {
                                    if (c.state === "stealing") {
                                        catchThief(c.id);
                                    } else if (c.state === "waiting-at-counter" && !activeCustomer) {
                                        startInteraction(c);
                                    }
                                }}
                                className={`absolute bottom-4 transition-all duration-100 flex flex-col items-center group ${
                                    c.state === "stealing" || (c.state === "waiting-at-counter" && !activeCustomer)
                                        ? "cursor-pointer z-20"
                                        : "z-10"
                                }`}
                                style={{ left: `${(c.x / 400) * 90 + 5}%` }}
                            >
                                {c.state === "stealing" && (
                                    <span className="text-xs absolute -top-8 bg-red-500 text-white px-2 py-1 rounded-full font-bold animate-bounce shadow-lg">
                                        🚨 THIEF!
                                    </span>
                                )}
                                {c.state === "waiting-at-counter" && !activeCustomer && (
                                    <span className="text-xs absolute -top-8 bg-blue-500 text-white px-2 py-1 rounded-full font-bold animate-bounce shadow-lg">
                                        💬 Hey!
                                    </span>
                                )}
                                {c.isRegular && (
                                    <span className="text-lg absolute -top-4 text-yellow-400 drop-shadow-md animate-pulse">⭐</span>
                                )}
                                <span className="text-5xl drop-shadow-xl transform group-hover:scale-110 transition-transform">{c.avatar}</span>
                                {c.type === "vip" && <span className="text-sm absolute -right-2 -top-2">👑</span>}

                                <div className="w-10 h-1.5 bg-black/50 rounded-full mt-1 overflow-hidden backdrop-blur-sm">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            c.patience / c.maxPatience > 0.6 ? "bg-green-400" :
                                            c.patience / c.maxPatience > 0.3 ? "bg-yellow-400" : "bg-red-400"
                                        }`}
                                        style={{ width: `${(c.patience / c.maxPatience) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </GlassCard>

                    <div className="flex-1 flex gap-4 min-h-0">
                        <GlassCard dark className="flex-[2] p-4 flex flex-col rounded-t-none border-t-0">
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-lg font-bold text-white/90 flex items-center gap-2">
                                    ☕ Café Shelves
                                    <span className="text-sm font-normal text-white/50">({totalShelfItems} items)</span>
                                </div>
                                {!isOpen && <div className="text-sm font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">CLOSED</div>}
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {shelves.slice(0, shelfCount).map((shelf, shelfIdx) => {
                                    const shelfProducts = shelf.slots.filter(s => s !== null);
                                    const avgFreshness = shelfProducts.length > 0
                                        ? shelfProducts.reduce((sum, s) => sum + (s?.freshness || 0), 0) / shelfProducts.length
                                        : 100;

                                    return (
                                        <div key={shelfIdx} className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-white/70">Shelf {shelfIdx + 1}</span>
                                                <span className="text-xs text-white/50 bg-black/20 px-2 py-0.5 rounded">
                                                    ${Math.round(PRODUCTS[0].basePrice * shelf.priceMultiplier)}/item
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-6 gap-2">
                                                {shelf.slots.map((slot, slotIdx) => {
                                                    const product = slot ? PRODUCTS.find(p => p.id === slot.productId) : null;
                                                    const isFresh = slot ? slot.freshness > 50 : true;
                                                    const isBook = product?.category === "books";
                                                    const conditionInfo = isBook && slot?.bookCondition
                                                        ? BOOK_CONDITIONS.find(c => c.condition === slot.bookCondition)
                                                        : null;

                                                    return (
                                                        <div
                                                            key={slotIdx}
                                                            onClick={(e) => {
                                                                if (slot && !selectedProduct) {
                                                                    const product = PRODUCTS.find(p => p.id === slot.productId);
                                                                    const isBook = product?.category === "books";
                                                                    if (isBook && !slot.hasPersonalNote && e.detail === 2) {
                                                                        addPersonalNoteToBook(shelfIdx, slotIdx);
                                                                    } else if (e.detail === 1) {
                                                                        removeFromShelf(shelfIdx, slotIdx);
                                                                    }
                                                                } else if (!slot && selectedProduct) {
                                                                    stockShelfSlot(shelfIdx, slotIdx);
                                                                }
                                                            }}
                                                            className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer relative group ${
                                                                slot
                                                                    ? slot.isSigned
                                                                        ? 'border-yellow-400/70 bg-yellow-500/20 hover:bg-yellow-500/30'
                                                                        : slot.hasPersonalNote
                                                                            ? 'border-blue-400/70 bg-blue-500/20 hover:bg-blue-500/30'
                                                                            : isFresh || isBook
                                                                                ? 'border-transparent bg-white/10 hover:bg-white/20'
                                                                                : 'border-red-400/50 bg-red-500/20 hover:bg-red-500/30'
                                                                    : selectedProduct
                                                                        ? 'border-dashed border-green-400/50 hover:border-green-400 hover:bg-green-500/20'
                                                                        : 'border-dashed border-white/10 hover:border-white/30'
                                                            }`}
                                                            title={slot
                                                                ? isBook
                                                                    ? `${product?.name} - ${conditionInfo?.description || 'Good'}${slot.isSigned ? ' ✍️ SIGNED!' : ''}${slot.previousOwner ? ` (from ${slot.previousOwner})` : ''}${slot.hasPersonalNote ? ` 📝 "${slot.personalNote}"` : ' (double-click to add note)'}`
                                                                    : `${product?.name} - ${Math.round(slot.freshness)}% fresh`
                                                                : 'Empty slot'}
                                                        >
                                                            {slot && product && (
                                                                <div className="relative">
                                                                    <span className="text-2xl transform group-hover:scale-110 transition-transform">{product.emoji}</span>
                                                                    {isBook && slot.isSigned && <span className="absolute -top-2 -right-2 text-xs">✍️</span>}
                                                                    {isBook && slot.hasPersonalNote && !slot.isSigned && <span className="absolute -top-2 -right-2 text-xs">📝</span>}
                                                                    {isBook && slot.bookCondition === "beloved" && !slot.isSigned && !slot.hasPersonalNote && <span className="absolute -top-2 -right-2 text-xs">💝</span>}
                                                                    {isBook && slot.bookCondition === "mint" && !slot.isSigned && !slot.hasPersonalNote && !slot.previousOwner && <span className="absolute -top-2 -right-2 text-xs">✨</span>}
                                                                    {!isBook && slot.freshness < 30 && <span className="absolute -top-1 -right-1 text-xs animate-pulse">⚠️</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>

                        <GlassCard dark className="flex-1 p-4 flex flex-col border-2 border-amber-800/30 bg-gradient-to-br from-amber-900/20 to-stone-900/30">
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-lg font-bold text-amber-200/90 flex items-center gap-2">
                                    📚 Book Corner
                                </div>
                                {selectedProduct && isBookProduct(selectedProduct) && (
                                    <span className="bg-amber-600/80 text-white text-sm px-3 py-1 rounded-full animate-pulse font-bold shadow-lg">
                                        👇 Display Book
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto pr-1 custom-scrollbar">
                                {bookCorner.map((slot, idx) => {
                                    const product = slot ? PRODUCTS.find(p => p.id === slot.productId) : null;
                                    const conditionInfo = slot?.bookCondition
                                        ? BOOK_CONDITIONS.find(c => c.condition === slot.bookCondition)
                                        : null;
                                    const canPlaceBook = selectedProduct && isBookProduct(selectedProduct) && !slot;

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                if (slot && !selectedProduct) {
                                                    removeFromBookCorner(idx);
                                                } else if (canPlaceBook) {
                                                    stockBookCorner(idx);
                                                }
                                            }}
                                            className={`aspect-[3/4] rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all cursor-pointer relative group ${
                                                slot
                                                    ? slot.isSigned
                                                        ? 'border-yellow-400/70 bg-gradient-to-b from-yellow-900/40 to-amber-900/60 hover:from-yellow-800/50 hover:to-amber-800/70'
                                                        : 'border-amber-700/50 bg-gradient-to-b from-amber-900/30 to-stone-900/50 hover:from-amber-800/40 hover:to-stone-800/60'
                                                    : canPlaceBook
                                                        ? 'border-dashed border-green-400/50 hover:border-green-400 hover:bg-green-500/20'
                                                        : 'border-dashed border-amber-700/30 hover:border-amber-600/50 bg-amber-900/10'
                                            }`}
                                            title={slot
                                                ? `${product?.name} by ${product?.author}\n${conditionInfo?.description || 'Good condition'}${slot.isSigned ? '\n✍️ SIGNED!' : ''}${slot.previousOwner ? `\nFrom: ${slot.previousOwner}` : ''}`
                                                : 'Empty book display'
                                            }
                                        >
                                            {slot && product ? (
                                                <>
                                                    <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">{product.emoji}</div>
                                                    {conditionInfo && <span className="text-xs opacity-70">{conditionInfo.emoji}</span>}
                                                    {slot.isSigned && <span className="absolute top-1 right-1 text-sm">✍️</span>}
                                                    {slot.bookCondition === "beloved" && !slot.isSigned && <span className="absolute top-1 right-1 text-sm">💝</span>}
                                                    <div className={`text-xs mt-auto font-bold ${slot.isSigned ? 'text-yellow-300' : 'text-amber-200/80'}`}>
                                                        ${getProductPrice(slot.productId)}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-amber-700/40 text-2xl">📖</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-4 min-w-[300px]">

                    <GlassCard className="flex-1 p-4 flex flex-col overflow-hidden min-h-[150px]">
                        <div className="text-sm font-bold text-white/90 mb-2 flex items-center gap-2">
                            Activity Log
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar flex flex-col-reverse gap-2">
                            {notifications.length === 0 && (
                                <div className="text-white/30 text-center text-sm py-4 italic">quiet day so far...</div>
                            )}
                            {notifications.map(n => (
                                <div key={n.id} className={`p-3 rounded-lg text-sm border backdrop-blur-sm animate-in fade-in slide-in-from-right-4 duration-300 ${
                                    n.type === "success" ? "bg-green-500/20 border-green-500/30 text-green-100" :
                                        n.type === "danger" ? "bg-red-500/20 border-red-500/30 text-red-100" :
                                            n.type === "warning" ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-100" :
                                                n.type === "event" ? "bg-purple-500/20 border-purple-500/30 text-purple-100" :
                                                    "bg-white/10 border-white/20 text-white/90"
                                }`}>
                                    {n.text}
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {Object.keys(storage).length > 0 && (
                        <GlassCard className="shrink-0 p-3 max-h-[200px] flex flex-col">
                            <div className="text-sm font-bold mb-2 text-white/90 flex justify-between items-center">
                                <span>Quick Stock</span>
                                {selectedProduct && (
                                    <button
                                        onClick={() => setSelectedProduct(null)}
                                        className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                            <div className="overflow-y-auto custom-scrollbar">
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(storage)
                                        .filter(([, item]) => item.quantity > 0)
                                        .map(([productId, item]) => {
                                            const product = PRODUCTS.find(p => p.id === productId)!;
                                            const isSelected = selectedProduct === productId;
                                            return (
                                                <button
                                                    key={productId}
                                                    onClick={() => setSelectedProduct(isSelected ? null : productId)}
                                                    className={`flex items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
                                                        isSelected
                                                            ? "bg-green-500/80 border-green-400 text-white shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                                                            : "bg-white/10 border-white/20 hover:border-green-400/50 text-white hover:bg-white/20"
                                                    }`}
                                                    title={product.name}
                                                >
                                                    <span className="text-lg">{product.emoji}</span>
                                                    <span className="text-sm font-medium">×{item.quantity}</span>
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    <div className="shrink-0">
                        {isPrepTime ? (
                            <GlassCard className="p-6 text-center">
                                <div className="mb-4">
                                    <div className="text-4xl mb-2 animate-bounce">☕📚</div>
                                    <div className="text-white font-bold text-xl mb-1">Preparation Time</div>
                                    <div className="text-white/70 text-sm">
                                        Stock shelves & set prices!
                                    </div>
                                </div>
                                <button
                                    onClick={openShop}
                                    className="w-full bg-gradient-to-r from-green-400 to-emerald-600 text-white font-bold py-4 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg animate-pulse text-lg"
                                >
                                    OPEN
                                </button>
                            </GlassCard>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { onClick: () => {setShowTablet(true); setIsPaused(true)}, icon: "📱", label: "Order Stock", color: "from-blue-500 to-blue-700", desc: "Buy items" },
                                    { onClick: () => {setShowPricing(true); setIsPaused(true)}, icon: "💰", label: "Pricing", color: "from-purple-500 to-purple-700", desc: "Set margins", disabled: totalShelfItems === 0 },
                                    { onClick: () => {setShowUpgrades(true); setIsPaused(true)}, icon: "⬆️", label: "Upgrades", color: "from-yellow-500 to-amber-600", desc: "Improve shop" },
                                    { onClick: () => {setShowStorage(true); setIsPaused(true)}, icon: "📦", label: "Storage", color: "from-orange-500 to-orange-700", badge: storageCount, desc: "View inventory" },
                                    { onClick: () => {setShowRegulars(true); setIsPaused(true)}, icon: "⭐", label: "Regulars", color: "from-pink-500 to-rose-600", badge: regulars.length, desc: "Loyal customers" },
                                ].map((btn, i) => (
                                    <button
                                        key={i}
                                        onClick={btn.onClick}
                                        disabled={btn.disabled}
                                        className={`bg-gradient-to-br ${btn.color} disabled:opacity-40 disabled:cursor-not-allowed text-white p-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group text-left ${i === 4 ? 'col-span-2' : ''}`}
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{btn.icon}</span>
                                            <div>
                                                <div className="font-bold leading-tight">{btn.label}</div>
                                                <div className="text-[10px] opacity-80 font-normal">{btn.desc}</div>
                                            </div>
                                        </div>
                                        {btn.badge !== undefined && btn.badge > 0 && (
                                            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                {btn.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {activeCustomer && (
                <div className="fixed inset-0  backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <GlassCard dark className="w-full max-w-2xl p-6 shadow-2xl border-2 border-white/20">
                        <div className="flex gap-6">
                            <div className="w-1/3 flex flex-col items-center text-center border-r border-white/10 pr-6">
                                <div className="text-8xl mb-4 drop-shadow-2xl animate-bounce-slow">{activeCustomer.avatar}</div>
                                {activeCustomer.name && (
                                    <div className="text-xl text-yellow-400 font-bold mb-1">
                                        ⭐ {activeCustomer.name}
                                    </div>
                                )}
                                <div className="text-white/60 text-sm mb-4">
                                    {activeCustomer.isRegular ? "Regular Customer" : "New Customer"}
                                </div>

                                <div className="w-full bg-black/30 rounded-full h-4 mb-2 overflow-hidden border border-white/10">
                                    <div
                                        className={`h-full transition-all duration-500 ${
                                            activeCustomer.satisfaction > 60 ? 'bg-green-500' :
                                            activeCustomer.satisfaction > 30 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${(activeCustomer.satisfaction + 100) / 2}%` }}
                                    />
                                </div>
                                <div className="text-xs text-white/50 mb-6">Satisfaction</div>

                                {activeCustomer.request.budget && (
                                    <div className="bg-green-900/40 text-green-300 px-4 py-2 rounded-lg border border-green-500/30 w-full">
                                        <div className="text-xs text-green-400/70 uppercase font-bold">Budget</div>
                                        <div className="text-xl font-bold">${activeCustomer.request.budget}</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col">
                                <div className="bg-white/10 rounded-2xl rounded-tl-none p-5 mb-6 relative border border-white/10">
                                    <p className="text-xl text-white font-medium leading-relaxed">
                                        &quot;{activeCustomer.request.text}&quot;
                                    </p>
                                    {activeCustomer.currentResponse && (
                                        <div className={`mt-4 p-3 rounded-xl text-sm border ${
                                            activeCustomer.currentResponse.includes("😊") || activeCustomer.currentResponse.includes("🎉") 
                                                ? "bg-green-500/20 border-green-500/30 text-green-100" 
                                                : activeCustomer.currentResponse.includes("😤") || activeCustomer.currentResponse.includes("😡")
                                                ? "bg-red-500/20 border-red-500/30 text-red-100"
                                                : "bg-blue-500/20 border-blue-500/30 text-blue-100"
                                        }`}>
                                            {activeCustomer.currentResponse}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar min-h-[150px]">
                                    <div className="text-sm font-bold text-white/70 uppercase tracking-wider mb-2">Offer Items</div>

                                    {getUniqueStockedProductIds().length > 0 && (
                                        <div className="mb-4">
                                            <div className="text-xs text-white/50 mb-1">☕ Café & Snacks</div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {getUniqueStockedProductIds().map(productId => {
                                                    const product = PRODUCTS.find(p => p.id === productId)!;
                                                    const alreadyOffered = activeCustomer.offeredProducts.some(item => item.productId === productId);
                                                    const slot = getFreshestSlot(productId);
                                                    const price = slot ? getProductPrice(productId, slot) : getProductPrice(productId);

                                                    return (
                                                        <button
                                                            key={productId}
                                                            onClick={() => offerProduct(productId)}
                                                            disabled={alreadyOffered || !slot}
                                                            className={`p-2 rounded-xl border transition-all flex flex-col items-center ${
                                                                alreadyOffered
                                                                    ? 'bg-white/5 border-white/10 opacity-50'
                                                                    : 'bg-white/10 border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95'
                                                            }`}
                                                            title={product.name}
                                                        >
                                                            <span className="text-2xl mb-1">{product.emoji}</span>
                                                            <span className="text-xs font-bold">${price}</span>
                                                            {slot && slot.freshness < 50 && (
                                                                <span className="text-[10px] text-red-400 animate-pulse">⚠️ Old</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {getBookCornerBooks().length > 0 && (
                                        <div>
                                            <div className="text-xs text-amber-400/70 mb-1">📚 Book Corner</div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {getBookCornerBooks().map(({ productId, slot, index }) => {
                                                    const product = PRODUCTS.find(p => p.id === productId)!;
                                                    const alreadyOffered = activeCustomer.offeredProducts.some(item => item.productId === productId);
                                                    const price = getProductPrice(productId);

                                                    return (
                                                        <button
                                                            key={`book-${index}`}
                                                            onClick={() => offerProduct(productId)}
                                                            disabled={alreadyOffered}
                                                            className={`p-2 rounded-xl border transition-all flex flex-col items-center relative ${
                                                                alreadyOffered
                                                                    ? 'bg-amber-900/20 border-amber-800/30 opacity-50'
                                                                    : slot?.isSigned
                                                                        ? 'bg-yellow-900/40 border-yellow-600/50 hover:border-yellow-500 hover:scale-105'
                                                                        : 'bg-amber-900/30 border-amber-700/40 hover:border-amber-500 hover:scale-105'
                                                            }`}
                                                            title={`${product.name} by ${product.author}`}
                                                        >
                                                            {slot?.isSigned && <span className="absolute top-1 right-1 text-[10px]">✍️</span>}
                                                            <span className="text-2xl mb-1">{product.emoji}</span>
                                                            <span className={`text-xs font-bold ${slot?.isSigned ? 'text-yellow-300' : 'text-amber-200'}`}>${price}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {getUniqueStockedProductIds().length === 0 && getBookCornerBooks().length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl">
                                            <div className="text-2xl mb-2">🕸️</div>
                                            <div className="text-white/50 text-sm">Shelves are empty!</div>
                                            <div className="text-white/30 text-xs">Stock up before opening next time.</div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-black/20 rounded-xl p-4 mb-4 border border-white/5 shrink-0">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Current Basket</span>
                                        <span className="text-green-400 font-bold text-lg">
                                            ${activeCustomer.offeredProducts.reduce((sum, item) => sum + item.price, 0)}
                                        </span>
                                    </div>

                                    {activeCustomer.offeredProducts.length === 0 ? (
                                        <div className="text-white/30 text-center py-4 italic text-sm">
                                            Offer items from the shelves...
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {activeCustomer.offeredProducts.map((item, i) => (
                                                <div key={i} className="bg-white/10 px-3 py-2 rounded-lg flex items-center gap-2 animate-in zoom-in duration-200">
                                                    <span className="text-xl">{PRODUCTS.find(p => p.id === item.productId)?.emoji}</span>
                                                    <span className="text-sm font-bold">${item.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

Go                                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
                                        <div>
                                            {activeCustomer.satisfaction > 60 && activeCustomer.offeredProducts.length >= 1 && (
                                                <span className="text-green-400 text-sm font-bold flex items-center gap-1 animate-pulse">
                                                    ✓ Ready to buy!
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <button
                                        onClick={() => finishInteraction(false)}
                                        className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl font-medium transition border border-white/10"
                                    >
                                        Goodbye...
                                    </button>
                                    <button
                                        onClick={() => finishInteraction(true)}
                                        className={`flex-1 py-4 rounded-xl text-white font-bold text-lg transition shadow-lg flex items-center justify-center gap-2 ${
                                            activeCustomer.offeredProducts.length > 0 && activeCustomer.satisfaction > 60
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] animate-pulse'
                                                : activeCustomer.offeredProducts.length > 0
                                                    ? 'bg-green-600 hover:bg-green-500'
                                                    : 'bg-white/10 opacity-50 cursor-not-allowed'
                                        }`}
                                        disabled={activeCustomer.offeredProducts.length === 0}
                                    >
                                        {activeCustomer.satisfaction > 60 && activeCustomer.offeredProducts.length > 0
                                            ? "Complete Sale"
                                            : "Complete Sale"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {currentDilemma && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="w-full max-w-md p-6">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">{currentDilemma.customer}</div>
                            {currentDilemma.customerName && (
                                <div className="text-yellow-400 text-sm mb-2">⭐ {currentDilemma.customerName}</div>
                            )}
                            <p className="text-white text-lg">{currentDilemma.situation}</p>
                        </div>

                        {dilemmaResult ? (
                            <div className="text-center">
                                <div className="bg-white/20 rounded-xl p-4 text-white animate-pulse">
                                    {dilemmaResult}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {currentDilemma.choices.map((choice, i) => (
                                    <button
                                        key={i}
                                        onClick={() => resolveDilemma(i)}
                                        className={`w-full py-4 px-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${
                                            i === 0
                                                ? 'bg-blue-500/30 border-blue-400/50 hover:bg-blue-500/50'
                                                : 'bg-white/10 border-white/20 hover:bg-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{choice.emoji}</span>
                                            <span className="text-white font-medium">{choice.text}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}

            {showTablet && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-md w-full p-1">
                        <div className="bg-black/40 rounded-xl p-4 max-h-[80vh] overflow-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-white">📱 Supplier Catalog</h2>
                                <button onClick={() => {setShowTablet(false); setIsPaused(false)}} className="text-2xl text-white/60 hover:text-white">×</button>
                            </div>

                            {currentEvent?.type === "supplier-deal" && (
                                <div className="bg-green-500/30 text-green-300 p-2 rounded-lg mb-3 text-center font-bold border border-green-500/50">
                                    🎉 30% OFF ALL ORDERS!
                                </div>
                            )}

                            {PRODUCTS.map(p => (
                                <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/10">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{p.emoji}</span>
                                        <div>
                                            <div className="font-medium text-sm text-white">{p.name}</div>
                                            <div className="text-xs text-white/50">
                                                ${p.cost} • Sells ${p.basePrice} • {p.freshnessDays}d fresh
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCart(c => ({ ...c, [p.id]: Math.max(0, (c[p.id] || 0) - 1) }))}
                                            className="w-8 h-8 bg-white/20 rounded-full font-bold text-white hover:bg-white/30"
                                        >-</button>
                                        <span className="w-8 text-center text-white">{cart[p.id] || 0}</span>
                                        <button
                                            onClick={() => setCart(c => ({ ...c, [p.id]: (c[p.id] || 0) + 1 }))}
                                            className="w-8 h-8 bg-blue-500/80 text-white rounded-full font-bold hover:bg-blue-500"
                                        >+</button>
                                    </div>
                                </div>
                            ))}

                            <div className="mt-4 pt-3 border-t border-white/20">
                                <div className="flex justify-between mb-1 text-white/80">
                                    <span>Subtotal:</span>
                                    <span className={currentEvent?.type === "supplier-deal" ? "line-through text-white/40" : ""}>
                                        ${cartTotal}
                                    </span>
                                </div>
                                {currentEvent?.type === "supplier-deal" && (
                                    <div className="flex justify-between mb-1 text-green-400">
                                        <span>After Discount:</span>
                                        <span className="font-bold">${discountedTotal}</span>
                                    </div>
                                )}
                                <div className="flex justify-between mb-3 text-white">
                                    <span>Your Cash:</span>
                                    <span className={discountedTotal > money ? "text-red-400" : ""}>${money}</span>
                                </div>
                                <button
                                    onClick={placeOrder}
                                    disabled={cartTotal === 0 || discountedTotal > money}
                                    className="w-full bg-green-500/80 disabled:bg-white/10 disabled:text-white/30 text-white font-bold py-3 rounded-xl hover:bg-green-500 transition"
                                >
                                    Place Order
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {showPricing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-4 max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">💰 Set Shelf Prices</h2>
                            <button onClick={() => setShowPricing(false)} className="text-2xl text-white/60 hover:text-white">×</button>
                        </div>

                        {shelves.map((shelf, i) => {
                            const shelfItems = shelf.slots.filter(s => s !== null);
                            if (shelfItems.length === 0) return null;

                            const uniqueProducts = [...new Set(shelfItems.map(s => s?.productId))];
                            const firstProduct = PRODUCTS.find(p => p.id === uniqueProducts[0])!;
                            const currentPrice = Math.round(firstProduct.basePrice * shelf.priceMultiplier);

                            return (
                                <div key={i} className="mb-4 p-3 bg-white/10 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">
                                                {uniqueProducts.map(pid => PRODUCTS.find(p => p.id === pid)?.emoji).join('')}
                                            </span>
                                            <span className="font-medium text-white">Shelf {i + 1}</span>
                                            <span className="text-xs text-white/50">({shelfItems.length} items)</span>
                                        </div>
                                        <span className="font-bold text-lg text-white">${currentPrice}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.8"
                                        max="2.5"
                                        step="0.1"
                                        value={shelf.priceMultiplier}
                                        onChange={(e) => updatePrice(i, parseFloat(e.target.value))}
                                        className="w-full accent-white"
                                    />
                                    <div className="flex justify-between text-xs text-white/50 mb-1">
                                        <span>Cheap 😊</span>
                                        <span>Expensive 💰</span>
                                    </div>
                                </div>
                            );
                        })}

                        {shelves.every(s => s.slots.every(slot => slot === null)) && (
                            <p className="text-white/50 text-center py-4">No products to price. Stock your shelves first!</p>
                        )}
                    </GlassCard>
                </div>
            )}

            {showUpgrades && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-4 max-w-md w-full max-h-[80vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">⬆️ Upgrades</h2>
                            <button onClick={() => setShowUpgrades(false)} className="text-2xl text-white/60 hover:text-white">×</button>
                        </div>

                        <div className="grid gap-2">
                            {upgrades.map(u => (
                                <div
                                    key={u.id}
                                    className={`p-3 rounded-xl border transition-all ${
                                        u.purchased
                                            ? "bg-green-500/20 border-green-500/50"
                                            : money >= u.cost
                                                ? "bg-white/10 border-white/20 hover:border-blue-400/50 cursor-pointer"
                                                : "bg-white/5 border-white/10 opacity-50"
                                    }`}
                                    onClick={() => !u.purchased && purchaseUpgrade(u.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{u.emoji}</span>
                                            <div>
                                                <div className="font-medium text-white">{u.name}</div>
                                                <div className="text-xs text-white/50">{u.description}</div>
                                            </div>
                                        </div>
                                        {u.purchased ? (
                                            <span className="text-green-400 font-bold">✓</span>
                                        ) : (
                                            <span className={`font-bold ${money >= u.cost ? "text-green-400" : "text-white/30"}`}>
                                                ${u.cost}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            )}

            {showStorage && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-4 max-w-sm w-full max-h-[80vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-white">📦 Storage</h2>
                                <div className="text-xs text-white/50">
                                    {storageCount}/{maxStorageCapacity} items
                                    {storageBonus > 0 && <span className="text-green-400 ml-1">(+{Math.round(storageBonus * 100)}% bonus)</span>}
                                </div>
                            </div>
                            <button onClick={() => setShowStorage(false)} className="text-2xl text-white/60 hover:text-white">×</button>
                        </div>

                        {Object.entries(storage).filter(([, item]) => item.quantity > 0).length === 0 ? (
                            <p className="text-white/50 text-center py-4">Empty! Order some stock.</p>
                        ) : (
                            Object.entries(storage)
                                .filter(([, item]) => item.quantity > 0)
                                .map(([productId, item]) => {
                                    const product = PRODUCTS.find(p => p.id === productId)!;
                                    return (
                                        <div
                                            key={productId}
                                            className="mb-3 p-3 bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 cursor-pointer transition-colors group"
                                            onClick={() => {
                                                setSelectedProduct(productId);
                                                setShowStorage(false);
                                                setIsPaused(false);
                                                notify(`Selected ${product.emoji} to stock`, "info");
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl group-hover:scale-110 transition-transform">{product.emoji}</span>
                                                    <div>
                                                        <span className="font-medium text-white">{product.name}</span>
                                                        <span className="text-white/60 ml-2">×{item.quantity}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Tap to Stock
                                                    </span>
                                                    <div className={`text-sm font-medium ${
                                                        item.freshnessPercent > 50 ? "text-green-400" : "text-red-400"
                                                    }`}>
                                                        {Math.round(item.freshnessPercent)}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/20 rounded-full">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        item.freshnessPercent > 50 ? "bg-green-400" :
                                                            item.freshnessPercent > 25 ? "bg-yellow-400" : "bg-red-400"
                                                    }`}
                                                    style={{ width: `${item.freshnessPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </GlassCard>
                </div>
            )}

            {showReviews && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-4 max-w-sm w-full max-h-[80vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">📝 Reviews</h2>
                            <button onClick={() => setShowReviews(false)} className="text-2xl text-white/60 hover:text-white">×</button>
                        </div>

                        <div className="text-center mb-4 p-3 bg-white/10 rounded-xl">
                            <div className="text-3xl mb-1">{renderStars(averageRating)}</div>
                            <div className="text-white/80">{averageRating.toFixed(1)} / 5.0</div>
                            <div className="text-sm text-white/50">{reviews.length} reviews</div>
                        </div>

                        {reviews.length === 0 ? (
                            <p className="text-white/50 text-center py-4">No reviews yet!</p>
                        ) : (
                            reviews.slice(0, 20).map((review, i) => (
                                <div key={i} className="mb-2 p-2 bg-white/10 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{review.avatar}</span>
                                        <div>
                                            <div className="text-sm">{renderStars(review.rating)}</div>
                                            <div className="text-sm text-white/70">{review.text}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </GlassCard>
                </div>
            )}

            {showRegulars && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-4 max-w-sm w-full max-h-[80vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">⭐ Regular Customers</h2>
                            <button onClick={() => {setShowRegulars(false); setIsPaused(false)}} className="text-2xl text-white/60 hover:text-white">×</button>
                        </div>

                        {regulars.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2">👥</div>
                                <p className="text-white/50">No regulars yet!</p>
                                <p className="text-white/40 text-sm mt-2">
                                    Serve customers well and they might become regulars who remember you!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {regulars.map(regular => (
                                    <div key={regular.id} className="p-3 bg-white/10 rounded-xl border border-white/20">
                                        <div className="flex items-start gap-3">
                                            <div className="text-3xl">{regular.avatar}</div>
                                            <div className="flex-1">
                                                <div className="font-medium text-white">{regular.name}</div>
                                                <div className="text-xs text-white/50">
                                                    Visits: {regular.visitCount} • Spent: ${regular.totalSpent}
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="text-xs text-white/60">Favorites:</span>
                                                    {regular.favoriteProducts.map(pid => (
                                                        <span key={pid} className="text-sm">
                                                            {PRODUCTS.find(p => p.id === pid)?.emoji}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-2">
                                                    <div className="flex justify-between text-xs text-white/50 mb-1">
                                                        <span>Relationship</span>
                                                        <span>{regular.relationship}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/20 rounded-full">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                regular.relationship > 70 ? 'bg-green-400' :
                                                                regular.relationship > 40 ? 'bg-yellow-400' : 'bg-red-400'
                                                            }`}
                                                            style={{ width: `${regular.relationship}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}

            {showAchievements && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-4 max-w-sm w-full max-h-[80vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">🏆 Achievements</h2>
                            <button onClick={() => setShowAchievements(false)} className="text-2xl text-white/60 hover:text-white">×</button>
                        </div>

                        <div className="grid gap-2">
                            {achievements.map(a => (
                                <div
                                    key={a.id}
                                    className={`p-3 rounded-xl border ${
                                        a.unlocked
                                            ? "bg-yellow-500/20 border-yellow-500/50"
                                            : "bg-white/5 border-white/10 opacity-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{a.emoji}</span>
                                        <div>
                                            <div className="font-medium text-white">{a.name}</div>
                                            <div className="text-xs text-white/50">{a.description}</div>
                                        </div>
                                        {a.unlocked && <span className="ml-auto text-yellow-400">✓</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            )}

            {showDaySummary && !gameOver && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-6 max-w-sm w-full">
                        <h2 className="text-2xl font-bold text-center mb-4 text-white">🌙 Day {day} Complete</h2>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between p-2 bg-green-500/20 rounded-xl text-white">
                                <span>Sales Revenue</span>
                                <span className="font-bold text-green-400">+${dailySales}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-blue-500/20 rounded-xl text-white">
                                <span>Customers Served</span>
                                <span className="font-bold">{dailyCustomers}</span>
                            </div>
                            {regularsServed > 0 && (
                                <div className="flex justify-between p-2 bg-yellow-500/20 rounded-xl text-white">
                                    <span>⭐ Regulars Served</span>
                                    <span className="font-bold text-yellow-400">{regularsServed}</span>
                                </div>
                            )}
                            {perfectServings > 0 && (
                                <div className="flex justify-between p-2 bg-purple-500/20 rounded-xl text-white">
                                    <span>🎯 Perfect Servings</span>
                                    <span className="font-bold text-purple-400">{perfectServings}</span>
                                </div>
                            )}
                            {stolenValue > 0 && (
                                <div className="flex justify-between p-2 bg-red-500/20 rounded-xl text-white">
                                    <span>Lost to Theft</span>
                                    <span className="font-bold text-red-400">-${stolenValue}</span>
                                </div>
                            )}
                            <div className="border-t border-white/20 pt-2">
                                <div className="flex justify-between p-2 bg-red-500/20 rounded-xl text-white">
                                    <span>Rent Due</span>
                                    <span className="font-bold text-red-400">-${rent}</span>
                                </div>
                                {debt > 0 && (
                                    <div className="flex justify-between p-2 bg-red-500/30 rounded-xl mt-1 text-white">
                                        <span>Debt</span>
                                        <span className="font-bold text-red-400">-${debt}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between p-2 bg-white/10 rounded-xl text-lg text-white">
                                <span>Cash</span>
                                <span className="font-bold">${money}</span>
                            </div>
                        </div>

                        {tomorrowTeaser && (
                            <div className="text-center text-white/70 text-sm mb-4 p-3 bg-white/10 rounded-xl italic">
                                💭 {tomorrowTeaser}
                            </div>
                        )}

                        {money < rent + debt && (
                            <div className="text-center text-red-400 text-sm mb-4 p-2 bg-red-500/20 rounded-xl">
                                ⚠️ Can&apos;t pay full rent!
                                {debt + rent - money > 150 && (
                                    <div className="font-bold">Debt over $150 = Game Over!</div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={payRentAndNextDay}
                            className={`w-full bg-gradient-to-r ${timeColors.accent} text-white font-bold py-3 rounded-xl hover:scale-105 transition-all`}
                        >
                            Start Day {day + 1} →
                        </button>
                    </GlassCard>
                </div>
            )}

            {gameOver && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="p-6 max-w-sm w-full text-center">
                        <h2 className="text-3xl font-bold mb-2 text-white">💸 Bankrupt!</h2>
                        <p className="text-white/70 mb-4">
                            You couldn&apos;t pay your debts after {day} days.
                        </p>

                        <div className="space-y-2 mb-4 text-left">
                            {[
                                { label: "Days", value: day },
                                { label: "Total Sales", value: `$${totalSales}`, color: "text-green-400" },
                                { label: "Customers", value: totalCustomersServed },
                                { label: "Rating", value: renderStars(averageRating) },
                                { label: "Achievements", value: `${achievements.filter(a => a.unlocked).length}/${achievements.length}` },
                            ].map((stat, i) => (
                                <div key={i} className="flex justify-between p-2 bg-white/10 rounded-xl text-white">
                                    <span>{stat.label}</span>
                                    <span className={`font-bold ${stat.color || ''}`}>{stat.value}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={restartGame}
                            className="w-full bg-gradient-to-r from-green-400/80 to-emerald-500/80 text-white font-bold py-3 rounded-xl hover:scale-105 transition-all"
                        >
                            🔄 Try Again
                        </button>
                    </GlassCard>
                </div>
            )}
            </div>
        </div>
    );
}

