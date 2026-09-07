#!/usr/bin/env python3
import os
import jwt
import requests
import random
import json
import sys
import argparse
from datetime import datetime, timedelta
import math
import zlib
import dotenv
from io import BytesIO
import re

# Import cairosvg for SVG to PNG conversion
try:
    import cairosvg
    CAIROSVG_AVAILABLE = True
except ImportError:
    CAIROSVG_AVAILABLE = False
    print("Warning: cairosvg library not available. Using fallback PNG generation.")
    print("Note: cairosvg requires the Cairo graphics library.")
    print("- For macOS: brew install cairo")
    print("- For Ubuntu/Debian: apt-get install libcairo2-dev")
    print("- For Windows: pip install cairosvg")

# API base URL. Defaults to the local stack; override with --api-url or
# API_BASE_URL to seed a deployed environment.
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api")

# JWT token for authentication
JWT_TOKEN = None

# Function to set the JWT token
def set_jwt_token(token):
    global JWT_TOKEN
    JWT_TOKEN = token
    print(f"JWT token set successfully: {JWT_TOKEN}")

# Function to get headers with Authorization
def get_auth_headers():
    headers = {}
    if JWT_TOKEN:
        headers["Authorization"] = f"Bearer {JWT_TOKEN}"
    return headers

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

# Shared with the API generator; loaded relative to this script for any working directory.
with open(os.path.join(os.path.dirname(__file__), "../api/src/models/generation-data.json"), encoding="utf-8") as generation_data_file:
    GENERATION_DATA = json.load(generation_data_file)

# Tournament name components
REGIONS = GENERATION_DATA["REGIONS"]

SPONSORS = GENERATION_DATA["SPONSORS"]

TOURNAMENT_TYPES = GENERATION_DATA["TOURNAMENT_TYPES"]

TOURNAMENT_PREFIXES = GENERATION_DATA["TOURNAMENT_PREFIXES"]

TOURNAMENT_SUFFIXES = GENERATION_DATA["TOURNAMENT_SUFFIXES"]

# Team name components
TEAM_PREFIXES = GENERATION_DATA["TEAM_PREFIXES"]

TEAM_ADJECTIVES = GENERATION_DATA["TEAM_ADJECTIVES"]

TEAM_NOUNS = GENERATION_DATA["TEAM_NOUNS"]

# Countries
COUNTRIES = GENERATION_DATA["COUNTRIES"]

# First names and last names for player generation
FIRST_NAMES = GENERATION_DATA["FIRST_NAMES"]

LAST_NAMES = GENERATION_DATA["LAST_NAMES"]

# Nicknames for players
NICKNAMES = GENERATION_DATA["NICKNAMES"]

# Logo elements
# Collection of SVG logos that are free to use (public domain or open licensed)
LOGO_COLORS = GENERATION_DATA["LOGO_COLORS"]

# Collection of SVG logos that are free to use (public domain or open licensed)
SVG_LOGOS = GENERATION_DATA["SVG_LOGOS"]

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
    """Fetch every team from the API.

    The endpoint pages, so a request without limit and offset returns only the
    first page — which meant tournaments were only ever built from the teams
    that happened to come back first, never from ones generated later.
    """
    page_size = 100
    offset = 0
    teams = []
    try:
        while True:
            response = requests.get(
                f"{API_BASE_URL}/teams",
                params={"limit": page_size, "offset": offset},
                headers=get_auth_headers(),
            )
            if response.status_code != 200:
                print(f"Error fetching teams: {response.status_code}")
                break
            page = response.json().get("items", [])
            teams.extend(page)
            if len(page) < page_size:
                break
            offset += page_size
        return teams
    except Exception as e:
        print(f"Error: {e}")
        return teams

def generate_team_logo():
    """Generate a team logo using SVG designs"""
    # Choose a random SVG template
    svg_template = random.choice(SVG_LOGOS)
    
    # Choose colors for the logo
    primary_color = random.choice(LOGO_COLORS)
    secondary_color = random.choice([c for c in LOGO_COLORS if c != primary_color])
    
    # Convert color names to hex codes
    color_map = GENERATION_DATA["LOGO_COLOR_HEX"]
    
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
            response = requests.post(f"{API_BASE_URL}/tournaments", json=tournament_data, headers=get_auth_headers())
            
            if response.status_code == 201:
                print(f"✅ Tournament created successfully with ID: {response.json().get('id')}")
            else:
                print(f"❌ Failed to create tournament: {response.status_code}")
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

def svg_to_png(svg_bytes):
    """Convert SVG to PNG
    
    Uses cairosvg for high-quality SVG rendering.
    Falls back to a basic circular logo if cairosvg is not available.
    
    Note: cairosvg requires the Cairo graphics library to be installed on your system.
    """
    # Try to use cairosvg
    if CAIROSVG_AVAILABLE:
        try:
            # Render at 2x size for better quality then scale down if needed
            png_bytes = cairosvg.svg2png(bytestring=svg_bytes, output_width=128, output_height=128, scale=2.0)
            return png_bytes
        except Exception as e:
            print(f"Error using cairosvg: {e}, falling back to simple PNG generation")
    
    # If cairosvg is not available or fails, use a simple fallback
    try:
        # Parse SVG to extract colors
        svg_string = svg_bytes.decode('utf-8')
        
        # Extract colors
        color_matches = re.findall(r'fill="(#[0-9A-Fa-f]{6})"', svg_string)
        primary_color = "#FF0000"  # Default red
        secondary_color = "#0000FF"  # Default blue
        
        if len(color_matches) >= 2:
            primary_color = color_matches[0]
            secondary_color = color_matches[1]
        elif len(color_matches) == 1:
            primary_color = color_matches[0]
            
        # Create a simple PNG with concentric circles
        width, height = 128, 128
        center_x, center_y = width // 2, height // 2
        outer_radius = min(width, height) // 2 - 2
        inner_radius = outer_radius * 0.7
        
        # Convert hex colors to RGB
        def hex_to_rgb(hex_color):
            h = hex_color.lstrip('#')
            return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
            
        primary_rgb = hex_to_rgb(primary_color)
        secondary_rgb = hex_to_rgb(secondary_color)
        
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
        
        return bytes(png_data)
        
    except Exception as e:
        print(f"Error in PNG fallback: {e}")
        # Return minimal 1×1 transparent PNG as last resort
        return b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x00\x00\x02\x00\x01\xe5\'\xde\xfc\x00\x00\x00\x00IEND\xaeB`\x82'

def fetch_players():
    """Fetch all players from the API to check for existing nicknames"""
    try:
        response = requests.get(f"{API_BASE_URL}/players", headers=get_auth_headers())
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
        
        # Convert SVG to PNG (for backward compatibility)
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
            
            # Add authorization header
            auth_headers = get_auth_headers()
            headers.update(auth_headers)
            
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
                
            player_response = requests.post(f"{API_BASE_URL}/players", json=player_data, headers=get_auth_headers())
            
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
    
    # Authentication options
    parser.add_argument("--token", type=str, help="JWT token for API authentication")
    parser.add_argument("--api-url", type=str, help="API base URL (default: $API_BASE_URL or http://localhost:8000/api)")
    
    args = parser.parse_args()

    dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../api/.env'))

    if args.api_url:
        global API_BASE_URL
        API_BASE_URL = args.api_url.rstrip("/")
    print(f"Targeting API: {API_BASE_URL}")
    
    # Set JWT token if provided
    if args.token:
        set_jwt_token(args.token)
    else:
        print(f"JWT token not provided, creating one with secret: {os.getenv('JWT_SECRET')}")
        token = jwt.encode({'username': 'admin'}, os.getenv('JWT_SECRET'), algorithm='HS256')
        set_jwt_token(token)
    
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
        print("  ./generate_data.py tournament 1 --token=\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\"")
        print("                                         # Generate a tournament with JWT authentication")
        sys.exit(1)
    
    main()
