#!/usr/bin/env python3
import requests
import random
import json
import sys
import argparse
from datetime import datetime, timedelta
import base64
import math
import zlib
import uuid
import io

# Try to import cairosvg for SVG to PNG conversion
try:
    import cairosvg
    CAIROSVG_AVAILABLE = True
except ImportError:
    CAIROSVG_AVAILABLE = False
    print("Warning: cairosvg library not available. Using fallback PNG generation.")
    print("For best results, install cairosvg: pip install cairosvg")

# API base URL
API_BASE_URL = "http://localhost:8000/api"

# Tournament types from API
TOURNAMENT_TYPE = ["SINGLE_GROUP"]

# Player roles from API
PLAYER_ROLES = [
    "Initiator", 
    "Duelist", 
    "Controller",
    "Sentinel", 
    "Flex", 
    "IGL"
]

# Match types from API
MATCH_TYPES = ["BO1", "BO3", "BO5"]

# Tournament name components
REGIONS = [
    "Global", "NA", "EU", "APAC", "LATAM", "BR", "KR", "JP", "OCE", "MENA", "CIS", "SEA", "SA",
    "Nordic", "Benelux", "DACH", "Iberia", "Balkans", "ANZ", "Mediterranean", "Baltic", "CEE",
    "West EU", "East EU", "South EU", "North EU", "East Asia", "South Asia", "Pan-American",
    "North Africa", "South Africa", "Middle East", "Caribbean", "Pacific", "Central America"
]

SPONSORS = [
    "Red Bull", "Intel", "Logitech", "HyperX", "Razer", "SteelSeries", "ZOWIE", "Alienware", "Corsair", 
    "ASUS ROG", "MSI", "Acer Predator", "Monster Energy", "G FUEL", "Mercedes-Benz", "Mastercard", "Visa",
    "Mountain Dew", "DHL", "Honda", "BMW", "Shell", "T-Mobile", "Verizon", "AT&T", "PepsiCo", "Coca-Cola",
    "Spotify", "Twitch", "Discord", "Microsoft", "Google", "Amazon", "LG", "Samsung", "Sony", "Panasonic",
    "Lenovo", "NordVPN", "ExpressVPN", "Subway", "KFC", "McDonald's", "Burger King", "Nike", "Adidas",
    "Puma", "Under Armour", "Cisco", "Oracle", "IBM", "Uber", "Lyft", "Airbnb", "State Farm", "Progressive",
    "Geico", "Qatar Airways", "Emirates", "American Airlines", "Delta", "FedEx", "UPS", "PayPal", "Venmo"
]

TOURNAMENT_TYPES = [
    "Masters", "Champions", "Challengers", "Open", "Invitational", "Cup", "League", "Series", 
    "Championship", "Finals", "Showdown", "Classic", "Summit", "Circuit", "Arena", "Royale",
    "Major", "Minor", "Qualifier", "Pro League", "Premier", "Elite", "Clash", "Rumble", "Brawl",
    "Colosseum", "Gauntlet", "Trophy", "Tour", "Contenders", "Division", "Faceoff", "Grand Slam",
    "Playoffs", "Wildcard", "Legends", "World Cup", "Nationals", "Continental", "Shootout", "Frenzy",
    "Mayhem", "Pandemonium", "Surge", "Blitz", "Ignition", "Fusion", "Overdrive", "Uprising", "Conquest"
]

TOURNAMENT_PREFIXES = [
    "Ultimate", "Grand", "Pro", "Elite", "Premier", "Prestige", "Supreme", "Diamond", "Platinum", "Gold",
    "Silver", "Bronze", "Radiant", "Immortal", "Ascendant", "Astral", "Celestial", "Cosmic", "Divine",
    "Summer", "Winter", "Spring", "Fall", "Annual", "Seasonal", "Monthly", "Weekly", "Daily", "Nightly",
    "Dawn of", "Rise of", "Legacy of", "Path to", "Road to", "Journey to", "Throne of", "Crucible of",
    "Realm of", "Forge of", "Nexus of", "Pinnacle of", "Summit of", "Zenith of", "Apex of", "Crown of"
]

TOURNAMENT_SUFFIXES = [
    "Showdown", "Spectacular", "Extravaganza", "Challenge", "Tour", "Clash", "Confrontation", "Encounter",
    "Battle", "War", "Conflict", "Exhibition", "Experience", "Explosion", "Rivalry", "Throwdown", 
    "Faceoff", "Standoff", "Duel", "Melee", "Skirmish", "Joust", "Contest", "Trial", "Proving Ground",
    "Season", "Split", "Quarter", "Opening", "Closing", "Kickoff", "Finale", "Grand Finale", "Conclusion",
    "Genesis", "Evolution", "Revolution", "Renaissance", "Reborn", "Resurgence", "Resurrection", "Rebirth"
]

# Team name components
TEAM_PREFIXES = [
    "Team", "Squad", "Guild", "Clan", "Legion", "Alliance", "", "Project", "Crew", "Dynasty", "Syndicate", "Collective",
    "House of", "Brotherhood", "Society", "Assembly", "Corporation", "Incorporated", "LLC", "Union", "Federation",
    "Network", "Consortium", "Coalition", "Association", "Agency", "Division", "Command", "Task Force", "Initiative",
    "Operatives", "Organization", "Empire", "Kingdom", "Dominion", "Republic", "State", "Nation", "Tribe", "Horde"
]

TEAM_ADJECTIVES = [
    "Elite", "Rogue", "Phantom", "Shadow", "Thunder", "Mystic", "Venom", "Eternal", "Cosmic", "Apex", 
    "Radiant", "Primal", "Quantum", "Digital", "Cyber", "Fusion", "Frost", "Inferno", "Lunar", "Prime",
    "Solar", "Astral", "Celestial", "Divine", "Immortal", "Ethereal", "Spectral", "Arcane", "Enigmatic",
    "Feral", "Wild", "Savage", "Ferocious", "Relentless", "Merciless", "Ruthless", "Tenacious", "Dauntless",
    "Fearless", "Valiant", "Gallant", "Heroic", "Noble", "Royal", "Majestic", "Sovereign", "Paramount",
    "Supreme", "Ultimate", "Absolute", "Perfect", "Flawless", "Pure", "True", "Genuine", "Authentic",
    "Swift", "Rapid", "Quick", "Agile", "Nimble", "Deft", "Precise", "Accurate", "Exact", "Calculated"
]

TEAM_NOUNS = [
    "Force", "Gaming", "Esports", "Tactics", "Wolves", "Warriors", "Legends", "Titans", "Dragons", "Phoenix", 
    "Vipers", "Knights", "Guardians", "Ninjas", "Ghosts", "Sentinels", "Rebels", "Hunters", "Ascension", "Pulse",
    "Sharks", "Lions", "Tigers", "Bears", "Eagles", "Hawks", "Falcons", "Ravens", "Vultures", "Pythons", "Cobras",
    "Scorpions", "Spiders", "Wasps", "Hornets", "Mantis", "Wolves", "Foxes", "Jackals", "Wyverns", "Griffins",
    "Hydras", "Chimeras", "Krakens", "Leviathans", "Behemoths", "Golems", "Gargoyles", "Gorgons", "Minotaurs",
    "Centaurs", "Cyclops", "Djinns", "Genies", "Angels", "Demons", "Devils", "Imps", "Fiends", "Ghouls", "Wraiths",
    "Spectres", "Phantoms", "Poltergeists", "Banshees", "Sirens", "Mermaids", "Nymphs", "Dryads", "Fairies", "Elves",
    "Wizards", "Sorcerers", "Mages", "Enchanters", "Warlocks", "Witches", "Diviners", "Oracles", "Seers", "Prophets",
    "Samurai", "Ronin", "Shinobi", "Daimyo", "Shogun", "Berserkers", "Vikings", "Valkyries", "Templars", "Crusaders",
    "Paladins", "Clerics", "Druids", "Monks", "Bards", "Rangers", "Archers", "Snipers", "Gunslingers", "Bandits",
    "Outlaws", "Pirates", "Corsairs", "Marauders", "Rogues", "Assassins", "Mercenaries", "Commandos", "Operators"
]

# Countries
COUNTRIES = [
    "United States", "Canada", "Brazil", "Argentina", "Chile", 
    "United Kingdom", "France", "Germany", "Spain", "Italy",
    "Sweden", "Finland", "Denmark", "Norway", "Poland",
    "South Korea", "Japan", "China", "Thailand", "Indonesia",
    "Australia", "New Zealand", "South Africa", "Egypt", "Nigeria",
    "Russia", "Ukraine", "Turkey", "Mexico", "Colombia",
    "Peru", "Philippines", "Malaysia", "Singapore", "Vietnam",
    "India", "Pakistan", "Netherlands", "Belgium", "Portugal",
    "Austria", "Switzerland", "Greece", "Ireland", "Romania",
    "Bulgaria", "Hungary", "Czech Republic", "Slovakia", "Serbia",
    "Croatia", "Slovenia", "Lithuania", "Latvia", "Estonia",
    "Kazakhstan", "Uzbekistan", "Georgia", "Armenia", "Azerbaijan",
    "Saudi Arabia", "UAE", "Qatar", "Kuwait", "Bahrain",
    "Israel", "Jordan", "Lebanon", "Morocco", "Tunisia",
    "Ghana", "Kenya", "Ethiopia", "Senegal", "Ivory Coast",
    "Taiwan", "Hong Kong", "Macau", "Mongolia", "Nepal",
    "Sri Lanka", "Bangladesh", "Myanmar", "Cambodia", "Laos"
]

# First names and last names for player generation
FIRST_NAMES = [
    "Adam", "Alex", "Benjamin", "Caleb", "Daniel", "David", "Ethan", "Felix", "Gabriel", "Henry",
    "Isaac", "Jacob", "Kevin", "Liam", "Matthew", "Nathan", "Oliver", "Peter", "Ryan", "Samuel",
    "Thomas", "William", "Zack", "James", "Michael", "Robert", "John", "Austin", "Tyler", "Jason",
    "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
    "Carlos", "Maksym", "Yuki", "Jin", "Wei", "Ahmed", "Viktor", "Ivan", "Kim", "Ananya",
    "Lucas", "Noah", "Juan", "Luis", "Miguel", "Sofia", "Lena", "Anna", "Maria", "Fatima",
    "Hiroshi", "Takumi", "Ryu", "Daisuke", "Kenji", "Satoshi", "Yusuke", "Akira", "Haruki", "Hayato",
    "Javier", "Alejandro", "Mateo", "Diego", "Andres", "Pablo", "Roberto", "Eduardo", "Marco", "Antonio",
    "Alexei", "Dmitri", "Mikhail", "Sergei", "Vladimir", "Nikolai", "Yuri", "Pavel", "Anatoly", "Igor",
    "Hans", "Klaus", "Lukas", "Josef", "Stefan", "Andreas", "Franz", "Martin", "Wolfgang", "Jürgen",
    "Pierre", "Jean", "François", "Antoine", "Louis", "Mathieu", "Philippe", "Laurent", "Nicolas", "André",
    "Rajesh", "Vikram", "Amit", "Arjun", "Sunil", "Anil", "Rahul", "Sanjay", "Vijay", "Rohit",
    "Mohamed", "Ali", "Hassan", "Mustafa", "Youssef", "Khalid", "Abdullah", "Omar", "Tariq", "Samir",
    "Cheng", "Ming", "Jian", "Hong", "Tao", "Feng", "Lei", "Xiang", "Yong", "Hao",
    "Ji-hoon", "Min-ho", "Sung-min", "Jae-sung", "Dong-hyun", "Seung-ho", "Kyung-soo", "Hyun-woo", "Tae-hyun", "Young-ho"
]

LAST_NAMES = [
    "Smith", "Johnson", "Brown", "Davis", "Wilson", "Miller", "Moore", "Taylor", "Anderson", "Thomas",
    "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez",
    "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "King", "Wright", "Scott", "Green",
    "Kim", "Park", "Choi", "Wang", "Li", "Zhang", "Chen", "Tanaka", "Suzuki", "Sato",
    "Ivanov", "Petrov", "Singh", "Patel", "Nguyen", "Tran", "Santos", "Silva", "Fernandez", "Lopez",
    "Muller", "Weber", "Schmidt", "Fischer", "Hoffmann", "Gomez", "Hernandez", "Diaz", "Torres", "Reyes",
    "Yamamoto", "Nakamura", "Kobayashi", "Watanabe", "Takahashi", "Ito", "Saito", "Kato", "Nakajima", "Ueda",
    "Gonzalez", "Rodriguez", "Perez", "Sanchez", "Ramirez", "Flores", "Morales", "Ortiz", "Rivera", "Cruz",
    "Popov", "Smirnov", "Kuznetsov", "Sokolov", "Lebedev", "Kozlov", "Novikov", "Morozov", "Volkov", "Bogdanov",
    "Schneider", "Wagner", "Becker", "Koch", "Schulz", "Wolf", "Neumann", "Schwarz", "Zimmermann", "Braun",
    "Dubois", "Moreau", "Leroy", "Fournier", "Girard", "Morel", "Lefebvre", "Mercier", "Dupont", "Lambert",
    "Sharma", "Kumar", "Gupta", "Patel", "Das", "Joshi", "Kaur", "Malhotra", "Nair", "Rao",
    "Al-Farsi", "Al-Said", "Al-Balushi", "Al-Mamari", "El-Masri", "Al-Shamsi", "Al-Zaabi", "Al-Maqbali", "Al-Hajri", "Al-Kindi",
    "Liu", "Yang", "Huang", "Zhao", "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu",
    "Jeong", "Kang", "Song", "Yoon", "Lim", "Kwon", "Choi", "Han", "Jang", "Yoo"
]

# Nicknames for players
NICKNAMES = [
    "Ace", "Blaze", "Clutch", "Demon", "Eagle", "Flash", "Ghost", "Hero", "Ice", "Joker",
    "Knight", "Legend", "Mystic", "Ninja", "Omega", "Phantom", "Quake", "Reaper", "Shadow", "Tiger",
    "Viper", "Wizard", "Xeno", "Yeti", "Zero", "Sniper", "Swift", "Thunder", "Rocket", "Phoenix",
    "Hawk", "Wolf", "Cobra", "Shark", "Lion", "Titan", "Vector", "Raptor", "Fury", "Bolt",
    "Pixel", "Crypto", "Matrix", "Nova", "Zenith", "Cypher", "Echo", "Havoc", "Jett", "Mirage",
    "Neon", "Orion", "Pulse", "Raven", "Sage", "Tempest", "Void", "Wrath", "Spark", "Glitch",
    "Frost", "Breeze", "Drift", "Specter", "Ember", "Stealth", "Zephyr", "Sova", "Killjoy", "Vanguard",
    "Astra", "Brim", "Chamber", "KAY/O", "Omen", "Phoenix", "Raze", "Reyna", "Skye", "Yoru",
    "Harbor", "Deadlock", "Fade", "Iso", "Gekko", "Clove", "s1mple", "ZywOo", "dev1ce", "NiKo", 
    "coldzera", "Faker", "Shroud", "ScreaM", "kennyS", "GuardiaN", "Zonic", "KrimZ", "GeT_RiGhT", "f0rest",
    "Neo", "TaZ", "Hiko", "Shox", "apEX", "NBK", "Flusha", "JW", "pasha", "Snax", 
    "Fallen", "Taco", "rain", "olofmeister", "Elige", "Twistzz", "NAF", "Brehze", "Ethan", "Stewie2k",
    "autimatic", "nitr0", "Tarik", "jks", "Jame", "Electronic", "Boombl4", "Perfecto", "flamie", "B1t",
    "huNter", "nexa", "Aleksib", "valde", "Snappi", "Xyp9x", "dupreeh", "k0nfig", "gla1ve", "Magisk",
    "Bubzkji", "tabseN", "tiziaN", "syrsoN", "Ax1Le", "YEKINDAR", "Jame", "FL1T", "qikert", "SANJI"
]

# Logo elements
# Collection of SVG logos that are free to use (public domain or open licensed)
LOGO_COLORS = ["red", "blue", "green", "yellow", "purple", "orange", "black", "white", 
              "gold", "silver", "crimson", "navy", "emerald", "azure", "violet", "amber"]

# Collection of SVG logos that are free to use (public domain or open licensed)
SVG_LOGOS = [
    # Simple shield
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path fill="{secondary_color}" d="M50 5 L90 20 L90 50 C90 75 70 90 50 95 C30 90 10 75 10 50 L10 20 Z" />
        <path fill="{primary_color}" d="M50 15 L80 25 L80 50 C80 70 65 80 50 85 C35 80 20 70 20 50 L20 25 Z" />
        <path fill="{secondary_color}" d="M50 25 L70 35 L70 55 C70 65 60 75 50 80 C40 75 30 65 30 55 L30 35 Z" />
    </svg>""",
    
    # Circle with star
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <path fill="{primary_color}" d="M50 15 L57 35 L79 35 L61 50 L68 70 L50 58 L32 70 L39 50 L21 35 L43 35 Z"/>
    </svg>""",
    
    # Wolf silhouette
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <path fill="{primary_color}" d="M25,30 L35,15 L45,30 L55,30 L65,15 L75,30 L80,45 L75,60 L65,70 L55,75 L45,75 L35,70 L25,60 L20,45 Z"/>
        <circle fill="{secondary_color}" cx="35" cy="40" r="5"/>
        <circle fill="{secondary_color}" cx="65" cy="40" r="5"/>
    </svg>""",
    
    # Eagle wings
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <path fill="{primary_color}" d="M20,60 C30,40 40,30 50,25 C60,30 70,40 80,60 L75,65 C65,50 60,45 50,40 C40,45 35,50 25,65 Z"/>
        <path fill="{secondary_color}" d="M40,65 L50,55 L60,65 L50,80 Z"/>
    </svg>""",
    
    # Dragon
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <path fill="{primary_color}" d="M30,30 L40,15 L50,25 L60,15 L70,30 L80,50 L70,70 L50,80 L30,70 L20,50 Z"/>
        <path fill="{secondary_color}" d="M35,40 L45,30 L55,30 L65,40 L65,60 L50,70 L35,60 Z"/>
    </svg>""",
    
    # Letter X emblem
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <path fill="{primary_color}" d="M30,20 L50,40 L70,20 L80,30 L60,50 L80,70 L70,80 L50,60 L30,80 L20,70 L40,50 L20,30 Z"/>
    </svg>""",
    
    # Mountain peaks
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <path fill="{primary_color}" d="M20,70 L35,40 L50,60 L65,40 L80,70 Z"/>
        <path fill="{secondary_color}" d="M30,70 L40,50 L50,65 L60,50 L70,70 Z"/>
    </svg>""",
    
    # Lion head
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <path fill="{primary_color}" d="M25,25 L35,15 L45,25 L55,25 L65,15 L75,25 L85,40 L75,60 L60,75 L40,75 L25,60 L15,40 Z"/>
        <circle fill="{secondary_color}" cx="40" cy="45" r="5"/>
        <circle fill="{secondary_color}" cx="60" cy="45" r="5"/>
        <path fill="{secondary_color}" d="M45,60 L55,60 L50,70 Z"/>
    </svg>""",
    
    # Geometric hexagon
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <path fill="{primary_color}" d="M50,20 L75,35 L75,65 L50,80 L25,65 L25,35 Z"/>
        <path fill="{secondary_color}" d="M50,35 L65,45 L65,65 L50,75 L35,65 L35,45 Z"/>
    </svg>""",
    
    # Crossed swords
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <path fill="{primary_color}" d="M35,20 L40,25 L25,40 L40,55 L35,60 L20,45 L15,50 L10,45 L35,20 Z"/>
        <path fill="{primary_color}" d="M65,20 L60,25 L75,40 L60,55 L65,60 L80,45 L85,50 L90,45 L65,20 Z"/>
        <circle fill="{secondary_color}" cx="50" cy="50" r="10"/>
    </svg>""",
    
    # Phoenix
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <path fill="{primary_color}" d="M50,15 C60,25 70,25 80,20 C75,35 80,45 90,50 C80,55 75,65 80,80 C70,75 60,75 50,85 C40,75 30,75 20,80 C25,65 20,55 10,50 C20,45 25,35 20,20 C30,25 40,25 50,15 Z"/>
        <path fill="{secondary_color}" d="M50,25 C55,35 65,35 70,30 C65,45 75,50 70,60 C65,55 55,55 50,65 C45,55 35,55 30,60 C25,50 35,45 30,30 C35,35 45,35 50,25 Z"/>
    </svg>""",
    
    # Lightning bolt
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <path fill="{primary_color}" d="M55,15 L25,50 L45,55 L35,85 L75,45 L55,40 Z"/>
    </svg>""",
    
    # Abstract Shapes
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <rect fill="{primary_color}" x="25" y="25" width="20" height="20" transform="rotate(45 35 35)"/>
        <rect fill="{primary_color}" x="55" y="25" width="20" height="20" transform="rotate(45 65 35)"/>
        <rect fill="{primary_color}" x="40" y="55" width="20" height="20" transform="rotate(45 50 65)"/>
    </svg>""",
    
    # Shark fin
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle fill="{secondary_color}" cx="50" cy="50" r="45"/>
        <path fill="{primary_color}" d="M25,65 C35,60 45,50 50,20 C55,50 65,60 75,65 C65,75 55,80 50,80 C45,80 35,75 25,65 Z"/>
    </svg>""",
    
    # Pentagon shield
    """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path fill="{secondary_color}" d="M50,10 L90,30 L80,75 L50,90 L20,75 L10,30 Z"/>
        <path fill="{primary_color}" d="M50,20 L80,35 L70,70 L50,80 L30,70 L20,35 Z"/>
        <path fill="{secondary_color}" d="M50,30 L70,40 L65,65 L50,75 L35,65 L30,40 Z"/>
    </svg>"""
]

def generate_random_date_range(start_date=None, end_date=None):
    """
    Generate a random date range in the future or use provided dates
    
    Args:
        start_date (str, optional): Start date in ISO format (YYYY-MM-DD)
        end_date (str, optional): End date in ISO format (YYYY-MM-DD)
    """
    if start_date and end_date:
        try:
            # Parse the provided dates
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            return start.isoformat(), end.isoformat()
        except ValueError as e:
            print(f"Error parsing dates: {e}")
            print("Using random dates instead.")
    
    # Generate random dates if none provided or if parsing failed
    start = datetime.now() + timedelta(days=random.randint(30, 180))
    duration = random.randint(3, 14)  # 3-14 days
    end = start + timedelta(days=duration)
    
    return start.isoformat(), end.isoformat()

def generate_unique_short_name(base_name):
    """Generate a unique short name for a team by adding random suffix"""
    # Take either the base name or the last word of a multi-word name
    short_name = base_name.split()[-1] 
    
    # Add a random number suffix to make it more unique
    random_suffix = str(random.randint(1, 999))
    
    return f"{short_name}{random_suffix}"

def fetch_teams():
    """Fetch teams from the API"""
    try:
        response = requests.get(f"{API_BASE_URL}/teams")
        if response.status_code == 200:
            data = response.json()
            return data.get("items", [])
        else:
            print(f"Error fetching teams: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error: {e}")
        return []

def generate_team_logo():
    """Generate a team logo using SVG designs"""
    # Choose a random SVG template
    svg_template = random.choice(SVG_LOGOS)
    
    # Choose colors for the logo
    primary_color = random.choice(LOGO_COLORS)
    secondary_color = random.choice([c for c in LOGO_COLORS if c != primary_color])
    
    # Convert color names to hex codes
    color_map = {
        "red": "#FF0000", 
        "blue": "#0000FF", 
        "green": "#008000",
        "yellow": "#FFFF00", 
        "purple": "#800080", 
        "orange": "#FFA500",
        "black": "#000000", 
        "white": "#FFFFFF",
        "gold": "#FFD700", 
        "silver": "#C0C0C0", 
        "crimson": "#DC143C",
        "navy": "#000080", 
        "emerald": "#008000", 
        "azure": "#007FFF",
        "violet": "#8A2BE2", 
        "amber": "#FFBF00"
    }
    
    # Get hex values for colors
    primary_hex = color_map.get(primary_color, "#" + ''.join([random.choice('0123456789ABCDEF') for _ in range(6)]))
    secondary_hex = color_map.get(secondary_color, "#" + ''.join([random.choice('0123456789ABCDEF') for _ in range(6)]))
    
    # Apply colors to the SVG using format instead of replace
    colored_svg = svg_template.format(primary_color=primary_hex, secondary_color=secondary_hex)
    
    # Return the raw SVG as bytes
    return colored_svg.encode('utf-8')

def distribute_nationalities(players_count=5):
    """
    Generate a distribution of nationalities for a team
    
    Returns a list of country names for each player
    """
    # Define probability weights for different nationality distributions
    distribution_types = [
        {"name": "all_same", "probability": 0.3},  # All players from same country
        {"name": "majority", "probability": 0.4},  # Most players (3-4) from one country
        {"name": "duo_duo", "probability": 0.2},   # Two from one country, two from another
        {"name": "diverse", "probability": 0.1}    # All or most from different countries
    ]
    
    # Choose distribution type based on probabilities
    distribution_type = random.choices(
        [d["name"] for d in distribution_types],
        weights=[d["probability"] for d in distribution_types]
    )[0]
    
    # Generate nationality distribution based on selected type
    if distribution_type == "all_same":
        primary_country = random.choice(COUNTRIES)
        nationalities = [primary_country] * players_count
    
    elif distribution_type == "majority":
        primary_country = random.choice(COUNTRIES)
        secondary_countries = random.sample([c for c in COUNTRIES if c != primary_country], 
                                           players_count - random.randint(3, 4))
        
        # How many players get the primary country
        primary_count = players_count - len(secondary_countries)
        
        # Create the distribution
        nationalities = [primary_country] * primary_count + secondary_countries
    
    elif distribution_type == "duo_duo":
        if players_count >= 4:
            country1 = random.choice(COUNTRIES)
            country2 = random.choice([c for c in COUNTRIES if c != country1])
            
            # For 5 players, add a third country
            if players_count == 5:
                country3 = random.choice([c for c in COUNTRIES if c not in [country1, country2]])
                nationalities = [country1, country1, country2, country2, country3]
            else:
                # For 4 players, just do 2+2
                nationalities = [country1, country1, country2, country2]
        else:
            # Fallback for less than 4 players
            nationalities = random.choices(COUNTRIES, k=players_count)
    
    elif distribution_type == "diverse":
        # Pick random countries, allow repeats if players_count > len(COUNTRIES)
        if players_count <= len(COUNTRIES):
            nationalities = random.sample(COUNTRIES, players_count)
        else:
            nationalities = random.choices(COUNTRIES, k=players_count)
    
    # Shuffle the nationalities so they're not predictably ordered
    random.shuffle(nationalities)
    return nationalities

def generate_tournament_name():
    """Generate a creative random tournament name with optional components"""
    components = []
    
    # 40% chance to include a prefix
    if random.random() < 0.4:
        components.append(random.choice(TOURNAMENT_PREFIXES))
    
    # 70% chance to include a sponsor
    if random.random() < 0.7:
        components.append(random.choice(SPONSORS))
    
    # 80% chance to include a region
    if random.random() < 0.8:
        components.append(random.choice(REGIONS))
    
    # Always include a tournament type
    components.append(random.choice(TOURNAMENT_TYPES))
    
    # 30% chance to include year
    if random.random() < 0.3:
        components.append(str(datetime.now().year))
    
    # 20% chance to include a suffix
    if random.random() < 0.2:
        components.append(random.choice(TOURNAMENT_SUFFIXES))
    
    # Join components to form name, make sure it's not empty
    name = " ".join(components)
    
    # If somehow we got an empty name (very unlikely), use a fallback
    if not name:
        name = f"{random.choice(SPONSORS)} {random.choice(TOURNAMENT_TYPES)}"
    
    return name

def generate_team_name():
    """Generate a creative random team name with optional components"""
    components = []
    
    # 70% chance to include a prefix
    if random.random() < 0.7:
        prefix = random.choice(TEAM_PREFIXES)
        if prefix:  # Only add if not empty string
            components.append(prefix)
    
    # Include different combinations of adjectives and nouns
    name_type = random.randint(1, 5)
    
    if name_type == 1:
        # Just a noun (e.g., "Titans")
        components.append(random.choice(TEAM_NOUNS))
    elif name_type == 2:
        # Adjective + Noun (e.g., "Savage Dragons")
        components.append(random.choice(TEAM_ADJECTIVES))
        components.append(random.choice(TEAM_NOUNS))
    elif name_type == 3:
        # Two nouns (e.g., "Phoenix Assassins")
        noun1 = random.choice(TEAM_NOUNS)
        noun2 = random.choice([n for n in TEAM_NOUNS if n != noun1])
        components.append(noun1)
        components.append(noun2)
    elif name_type == 4:
        # Two adjectives + Noun (e.g., "Wild Mystic Warriors")
        adj1 = random.choice(TEAM_ADJECTIVES)
        adj2 = random.choice([a for a in TEAM_ADJECTIVES if a != adj1])
        components.append(adj1)
        components.append(adj2)
        components.append(random.choice(TEAM_NOUNS))
    else:
        # Adjective + Two nouns (e.g., "Phantom Dragon Force")
        components.append(random.choice(TEAM_ADJECTIVES))
        noun1 = random.choice(TEAM_NOUNS)
        noun2 = random.choice([n for n in TEAM_NOUNS if n != noun1])
        components.append(noun1)
        components.append(noun2)
    
    # Join components to form name
    team_name = " ".join(components)
    
    # If somehow we got an empty name, use a fallback
    if not team_name:
        team_name = f"{random.choice(TEAM_ADJECTIVES)} {random.choice(TEAM_NOUNS)}"
    
    return team_name

def generate_player_nickname():
    """Generate a unique player nickname with various patterns"""
    pattern = random.randint(1, 5)
    
    if pattern == 1:
        # Simple nickname (e.g., "Phantom")
        return random.choice(NICKNAMES)
    elif pattern == 2:
        # Nickname with number (e.g., "Phantom42")
        return f"{random.choice(NICKNAMES)}{random.randint(1, 99)}"
    elif pattern == 3:
        # Stylized nickname (e.g., "xPhantomx")
        nickname = random.choice(NICKNAMES)
        prefix = random.choice(["x", "i", "o", "v", "s1", "The", "Mr", "Sir", ""])
        suffix = random.choice(["x", "z", "y", "TTV", "YT", "Pro", "TV", ""])
        return f"{prefix}{nickname}{suffix}"
    elif pattern == 4:
        # Two word nickname (e.g., "Phantom Assassin")
        nick1 = random.choice(NICKNAMES)
        nick2 = random.choice([n for n in NICKNAMES if n != nick1])
        return f"{nick1}{nick2}"
    else:
        # Shortened nickname with symbol (e.g., "Ph4nt0m")
        nickname = random.choice(NICKNAMES)
        # 50% chance to replace some letters with numbers
        if random.random() < 0.5:
            for old, new in [('a', '4'), ('e', '3'), ('i', '1'), ('o', '0'), ('s', '5'), ('t', '7')]:
                if old in nickname.lower() and random.random() < 0.7:
                    nickname = nickname.replace(old, new).replace(old.upper(), new)
        return nickname

def generate_player_attributes():
    """Generate detailed random player attributes with a signature strength"""
    attributes = {}
    attribute_names = [
        "clutch", "awareness", "aim", "positioning", "game_reading",
        "resilience", "confidence", "strategy", "adaptability", "communication",
        "unpredictability", "game_sense", "decision_making", "rage_fuel",
        "teamwork", "utility_usage"
    ]
    
    # Choose 1-2 signature strengths
    signature_attributes = random.sample(attribute_names, random.randint(1, 2))
    
    # Assign values to all attributes
    for attr in attribute_names:
        if attr in signature_attributes:
            # Signature attributes get highest values
            attributes[attr] = random.randint(2, 3)
        else:
            # Non-signature attributes are more balanced
            attributes[attr] = random.randint(0, 2)
    
    return attributes

def create_tournament(count=1, start_date=None, end_date=None, team_count=None):
    """
    Create a random tournament using the API
    
    Args:
        count (int): Number of tournaments to create
        start_date (str, optional): Start date in ISO format (YYYY-MM-DD)
        end_date (str, optional): End date in ISO format (YYYY-MM-DD)
        team_count (int, optional): Number of teams to include in the tournament
    """
    teams = fetch_teams()
    
    if not teams:
        print("No teams found. Cannot create tournament.")
        return
    
    for i in range(count):
        # Generate tournament data
        name = generate_tournament_name()
        tournament_start_date, tournament_end_date = generate_random_date_range(start_date, end_date)
        
        # Determine number of teams to include
        max_teams = min(16, len(teams))
        if team_count is not None and team_count > 0:
            num_teams = min(team_count, len(teams))
        else:
            num_teams = random.randint(4, max_teams)
            
        selected_teams = random.sample(teams, num_teams)
        
        # Create proper team objects for the API
        valid_teams = []
        for team in selected_teams:
            team_id = team.get("id")
            if team_id is not None:
                # Create the full team object expected by the API
                api_team = {
                    "id": team_id,
                }
                valid_teams.append(api_team)
        
        if not valid_teams:
            print("No valid team IDs found. Cannot create tournament.")
            continue
            
        country = random.choice(COUNTRIES)
        
        # Create tournament payload matching the TournamentApiModel format
        tournament_data = {
            "type": "SINGLE_GROUP",
            "name": name,
            "description": f"<strong>{name}</strong> is a premier esports tournament.",
            "country": country,
            "start_date": tournament_start_date,
            "end_date": tournament_end_date,
            "started": False,
            "ended": False,
            "teams": valid_teams
        }
        
        # Print the full payload for debugging
        print(f"Tournament payload: {json.dumps(tournament_data, indent=2)}")
        
        try:
            print(f"Creating tournament: {name} in {country} with {len(valid_teams)} teams")
            print(f"Start: {tournament_start_date}, End: {tournament_end_date}")
            response = requests.post(f"{API_BASE_URL}/tournaments", json=tournament_data)
            
            if response.status_code == 201:
                print(f"✅ Tournament created successfully with ID: {response.json().get('id')}")
            else:
                print(f"❌ Failed to create tournament: {response.status_code}")
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

def svg_to_png(svg_bytes):
    """Convert SVG to PNG, preserving the original design

    Attempts to use cairosvg if available, with a fallback to a simple
    circular logo if the library isn't installed.
    """
    # Try to use cairosvg if available
    if CAIROSVG_AVAILABLE:
        try:
            # Convert SVG to PNG using cairosvg (preserves the original design)
            png_bytes = cairosvg.svg2png(bytestring=svg_bytes, output_width=64, output_height=64)
            return png_bytes
        except Exception as e:
            print(f"Error using cairosvg: {e}, falling back to simple PNG generation")
            # Fall through to the fallback method
    
    # Fallback method - create a simple PNG if cairosvg is not available
    try:
        # Parse SVG to extract colors
        svg_string = svg_bytes.decode('utf-8')
        
        # Extract the primary and secondary colors
        import re
        primary_color = "#FF0000"  # Default red
        secondary_color = "#0000FF"  # Default blue
        
        # Search for hex colors in the SVG
        color_matches = re.findall(r'fill="(#[0-9A-Fa-f]{6})"', svg_string)
        if len(color_matches) >= 2:
            primary_color = color_matches[0]
            secondary_color = color_matches[1]
        elif len(color_matches) == 1:
            primary_color = color_matches[0]
        
        # Convert hex colors to RGB
        def hex_to_rgb(hex_color):
            h = hex_color.lstrip('#')
            return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
        
        try:
            primary_rgb = hex_to_rgb(primary_color)
            secondary_rgb = hex_to_rgb(secondary_color)
        except:
            primary_rgb = (255, 0, 0)  # Default red
            secondary_rgb = (0, 0, 255)  # Default blue
        
        # Create a PNG with a circle using these colors
        width, height = 64, 64
        center_x, center_y = width // 2, height // 2
        outer_radius = min(width, height) // 2 - 2
        inner_radius = outer_radius * 0.7
        
        # PNG header
        png_data = bytearray([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D,  # IHDR chunk length
            0x49, 0x48, 0x44, 0x52,  # "IHDR"
            (width >> 24) & 0xFF, (width >> 16) & 0xFF, (width >> 8) & 0xFF, width & 0xFF,  # width
            (height >> 24) & 0xFF, (height >> 16) & 0xFF, (height >> 8) & 0xFF, height & 0xFF,  # height
            0x08,  # bit depth
            0x06,  # color type (RGBA)
            0x00,  # compression method
            0x00,  # filter method
            0x00,  # interlace method
        ])
        
        # Calculate CRC for IHDR chunk
        ihdr_crc = zlib.crc32(png_data[12:29]) & 0xFFFFFFFF
        png_data.extend([(ihdr_crc >> 24) & 0xFF, (ihdr_crc >> 16) & 0xFF, (ihdr_crc >> 8) & 0xFF, ihdr_crc & 0xFF])
        
        # Create image data
        raw_data = bytearray()
        for y in range(height):
            raw_data.append(0)  # Filter type for each scanline
            for x in range(width):
                # Calculate distance from center
                dist = math.sqrt((x - center_x) ** 2 + (y - center_y) ** 2)
                
                if dist <= outer_radius:
                    if dist <= inner_radius:
                        # Inner circle - use primary color
                        r, g, b = primary_rgb
                    else:
                        # Outer ring - use secondary color
                        r, g, b = secondary_rgb
                    raw_data.extend([r, g, b, 255])  # RGBA
                else:
                    # Transparent background
                    raw_data.extend([0, 0, 0, 0])
        
        # Compress image data
        compressed_data = zlib.compress(raw_data)
        
        # IDAT chunk
        png_data.extend([
            (len(compressed_data) >> 24) & 0xFF, (len(compressed_data) >> 16) & 0xFF,
            (len(compressed_data) >> 8) & 0xFF, len(compressed_data) & 0xFF
        ])
        png_data.extend([0x49, 0x44, 0x41, 0x54])  # "IDAT"
        png_data.extend(compressed_data)
        
        # Calculate CRC for IDAT chunk
        idat_crc = zlib.crc32(png_data[-len(compressed_data)-4:-len(compressed_data)]) & 0xFFFFFFFF
        idat_crc = zlib.crc32(compressed_data, idat_crc) & 0xFFFFFFFF
        png_data.extend([(idat_crc >> 24) & 0xFF, (idat_crc >> 16) & 0xFF, (idat_crc >> 8) & 0xFF, idat_crc & 0xFF])
        
        # IEND chunk
        png_data.extend([
            0x00, 0x00, 0x00, 0x00,  # length
            0x49, 0x45, 0x4E, 0x44,  # "IEND"
            0xAE, 0x42, 0x60, 0x82   # CRC
        ])
        
        return png_data
        
    except Exception as e:
        print(f"Error converting SVG to PNG: {e}")
        # Return minimal 1×1 transparent PNG as fallback
        return b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x00\x00\x02\x00\x01\xe5\'\xde\xfc\x00\x00\x00\x00IEND\xaeB`\x82'

def fetch_players():
    """Fetch all players from the API to check for existing nicknames"""
    try:
        response = requests.get(f"{API_BASE_URL}/players")
        if response.status_code == 200:
            data = response.json()
            return data.get("items", [])
        else:
            print(f"Error fetching players: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error: {e}")
        return []

def is_nickname_unique(nickname, existing_players):
    """Check if a player nickname is unique"""
    # Check if any existing player has this nickname
    for player in existing_players:
        if player.get("nickname") == nickname:
            return False
    return True

def generate_unique_player_nickname(existing_players):
    """Generate a unique player nickname, checking against existing ones"""
    # Try up to 10 times to generate a unique nickname
    for _ in range(10):
        nickname = generate_player_nickname()
        if is_nickname_unique(nickname, existing_players):
            return nickname
    
    # If still not unique, add a random suffix
    base_nickname = generate_player_nickname()
    return f"{base_nickname}{random.randint(1000, 9999)}"

def is_short_name_unique(short_name, existing_teams):
    """Check if a team short name is unique"""
    # Check if any existing team has this short name
    for team in existing_teams:
        if team.get("short_name") == short_name:
            return False
    return True

def generate_truly_unique_short_name(base_name, existing_teams):
    """Generate a truly unique short name by checking against existing teams"""
    # Try up to 10 times with different suffixes
    for _ in range(10):
        short_name = generate_unique_short_name(base_name)
        if is_short_name_unique(short_name, existing_teams):
            return short_name
    
    # If still not unique, use a more robust approach with timestamp
    timestamp = int(datetime.now().timestamp()) % 10000
    short_name = f"{base_name.split()[-1]}{timestamp}"
    return short_name

def create_team_with_players(count=1, players_per_team=5):
    """Create a random team with players using the API, with proactive unique name checking"""
    # Fetch existing teams to check short name uniqueness
    existing_teams = fetch_teams()
    print(f"Fetched {len(existing_teams)} existing teams to ensure unique short names")
    
    # Fetch existing players to check nickname uniqueness
    existing_players = fetch_players()
    print(f"Fetched {len(existing_players)} existing players to ensure unique nicknames")
    
    for i in range(count):
        # Generate team data with guaranteed unique short name
        team_name = generate_team_name()
        short_name = generate_truly_unique_short_name(team_name, existing_teams)
        country = random.choice(COUNTRIES)
        
        # Generate a team logo as SVG
        svg_logo_bytes = generate_team_logo()
        
        # Convert SVG to PNG
        logo_bytes = svg_to_png(svg_logo_bytes)
        
        try:
            print(f"Creating team: {team_name} (short name: {short_name}) from {country}")
            
            # Create multipart form data
            import uuid
            boundary = str(uuid.uuid4())
            
            # Create multipart form data payload
            form_data = bytearray()
            
            # Add team data fields
            def add_text_field(name, value):
                form_data.extend(f'--{boundary}\r\n'.encode('utf-8'))
                form_data.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode('utf-8'))
                form_data.extend(f'{value}\r\n'.encode('utf-8'))
            
            # Add text fields
            add_text_field("short_name", short_name)
            add_text_field("full_name", team_name)
            add_text_field("description", f'<strong>{team_name}</strong> is a professional esports organization.')
            add_text_field("country", country)
            
            # Add logo file with proper headers for binary data
            form_data.extend(f'--{boundary}\r\n'.encode('utf-8'))
            form_data.extend(f'Content-Disposition: form-data; name="logo_image_file"; filename="logo.png"\r\n'.encode('utf-8'))
            form_data.extend(f'Content-Type: image/png\r\n\r\n'.encode('utf-8'))
            
            # Add binary file data
            form_data.extend(logo_bytes)
            
            # Add final boundary
            form_data.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))
            
            # Set headers with proper content type
            headers = {
                'Content-Type': f'multipart/form-data; boundary={boundary}'
            }
            
            # Send the request with binary data
            team_response = requests.post(
                f"{API_BASE_URL}/teams", 
                data=form_data,
                headers=headers
            )
            
            if team_response.status_code == 201:
                team = team_response.json()
                team_id = team.get("id")
                print(f"✅ Team created successfully with ID: {team_id}")
                
                # Add to existing teams list for future uniqueness checks
                existing_teams.append({"id": team_id, "short_name": short_name})
                
                # Generate nationality distribution for this team
                nationalities = distribute_nationalities(players_per_team)
                
                # Create players for this team with unique nicknames
                created_players = []
                for j in range(players_per_team):
                    player = create_player(
                        team_id=team_id, 
                        display_team_info=False, 
                        country=nationalities[j],
                        existing_players=existing_players + created_players
                    )
                    if player:
                        created_players.append(player)
                        existing_players.append(player)
            else:
                print(f"❌ Failed to create team: {team_response.status_code}")
                print(f"Response: {team_response.text}")
        except Exception as e:
            print(f"Error: {e}")

def create_player(count=1, team_id=None, display_team_info=True, country=None, existing_players=None):
    """Create random players and optionally assign to a team with proactive unique nickname checking"""
    # If existing_players wasn't provided, fetch them
    if existing_players is None:
        existing_players = fetch_players()
        print(f"Fetched {len(existing_players)} existing players to ensure unique nicknames")
    
    teams = []
    created_players = []
    
    # If no team_id is provided, get the list of teams to assign randomly
    if team_id is None:
        teams = fetch_teams()
        if not teams and not count == 0:
            print("No teams found. Cannot create player without a team.")
            return None
    
    for i in range(count if team_id is None else 1):
        # Generate player data with guaranteed unique nickname
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        nickname = generate_unique_player_nickname(existing_players)
        role = random.choice(PLAYER_ROLES)
        age = random.randint(18, 35)
        
        # Use provided country or pick random one
        player_country = country if country else random.choice(COUNTRIES)
        
        # If team_id wasn't provided, assign to a random team
        player_team_id = team_id
        team_name = None
        
        if player_team_id is None:
            selected_team = random.choice(teams)
            player_team_id = selected_team.get("id")
            team_name = selected_team.get("full_name")
        
        player_data = {
            "nickname": nickname,
            "full_name": f"{first_name} {last_name}",
            "age": age,
            "country": player_country,
            "team_id": player_team_id,
            "role": role,
            "player_attributes": generate_player_attributes()
        }
        
        try:
            if display_team_info and team_name:
                print(f"Creating player: {nickname} ({role}) from {player_country} for team {team_name}")
            else:
                print(f"Creating player: {nickname} ({role}) from {player_country}")
                
            player_response = requests.post(f"{API_BASE_URL}/players", json=player_data)
            
            if player_response.status_code == 201:
                player_data["id"] = player_response.json().get("id")
                if display_team_info:
                    print(f"✅ Player created successfully with ID: {player_data['id']}")
                else:
                    print(f"  ✅ Player created: {nickname} ({role})")
                
                # Add the created player to our list
                created_players.append(player_data)
            else:
                if display_team_info:
                    print(f"❌ Failed to create player: {player_response.status_code}")
                else:
                    print(f"  ❌ Failed to create player {nickname}: {player_response.status_code}")
                print(f"Response: {player_response.text}")
        except Exception as e:
            print(f"Error: {e}")
    
    # Return the first created player for single player creation, or the list for multiple
    if count == 1 and team_id is not None and created_players:
        return created_players[0]
    return created_players

def main():
    """Main function to parse arguments and run the script"""
    parser = argparse.ArgumentParser(description="Generate tournaments, teams, and players for VAVALM")
    parser.add_argument("type", choices=["tournament", "team", "player"], help="Type of data to generate")
    parser.add_argument("count", type=int, nargs="?", default=1, help="Number of items to generate")
    
    # Tournament options
    parser.add_argument("--start-date", type=str, help="Start date for tournament (YYYY-MM-DD)")
    parser.add_argument("--end-date", type=str, help="End date for tournament (YYYY-MM-DD)")
    parser.add_argument("--teams", type=int, help="Number of teams to include in the tournament")
    
    # Team options
    parser.add_argument("--players", type=int, default=5, help="Number of players per team (for team generation)")
    
    # Player options
    parser.add_argument("--team", type=int, help="Team ID to assign players to (for player generation)")
    parser.add_argument("--country", type=str, help="Country for the player(s) (for player generation)")
    
    args = parser.parse_args()
    
    if args.type == "tournament":
        create_tournament(args.count, args.start_date, args.end_date, args.teams)
    elif args.type == "team":
        create_team_with_players(args.count, args.players)
    elif args.type == "player":
        # If a country was specified, pass it to create_player
        if args.country and args.country in COUNTRIES:
            create_player(args.count, args.team, country=args.country)
        else:
            create_player(args.count, args.team)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: ./generate_data.py [tournament|team|player] [count] [options]")
        print("Examples:")
        print("  ./generate_data.py tournament 3        # Generate 3 tournaments")
        print("  ./generate_data.py tournament 1 --start-date=2023-06-01 --end-date=2023-06-15 --teams=8")
        print("                                         # Generate a tournament with specific dates and 8 teams")
        print("  ./generate_data.py team 2 --players=5  # Generate 2 teams with 5 players each")
        print("  ./generate_data.py player 5            # Generate 5 players assigned to random teams")
        print("  ./generate_data.py player 3 --team=1   # Generate 3 players assigned to team with ID 1")
        print("  ./generate_data.py player 2 --team=1 --country=\"South Korea\"")
        print("                                         # Generate 2 Korean players assigned to team with ID 1")
        sys.exit(1)
    
    main() 