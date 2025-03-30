#!/usr/bin/env python3
import requests
import random
import json
import sys
import argparse
from datetime import datetime, timedelta

# API base URL
API_BASE_URL = "http://localhost:8000"

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
REGIONS = ["Global", "NA", "EU", "APAC", "LATAM", "BR", "KR", "JP", "OCE", "MENA", "CIS", "SEA", "SA"]
SPONSORS = ["Red Bull", "Intel", "Logitech", "HyperX", "Razer", "SteelSeries", "ZOWIE", "Alienware", "Corsair", 
            "ASUS ROG", "MSI", "Acer Predator", "Monster Energy", "G FUEL", "Mercedes-Benz", "Mastercard", "Visa"]
TOURNAMENT_TYPES = ["Masters", "Champions", "Challengers", "Open", "Invitational", "Cup", "League", "Series", 
                    "Championship", "Finals", "Showdown", "Classic", "Summit", "Circuit", "Arena", "Royale"]

# Team name components
TEAM_PREFIXES = ["Team", "Squad", "Guild", "Clan", "Legion", "Alliance", "", "Project", "Crew", "Dynasty", "Syndicate", "Collective"]
TEAM_ADJECTIVES = ["Elite", "Rogue", "Phantom", "Shadow", "Thunder", "Mystic", "Venom", "Eternal", "Cosmic", "Apex", 
                  "Radiant", "Primal", "Quantum", "Digital", "Cyber", "Fusion", "Frost", "Inferno", "Lunar", "Prime"]
TEAM_NOUNS = ["Force", "Gaming", "Esports", "Tactics", "Wolves", "Warriors", "Legends", "Titans", "Dragons", "Phoenix", 
             "Vipers", "Knights", "Guardians", "Ninjas", "Ghosts", "Sentinels", "Rebels", "Hunters", "Ascension", "Pulse"]

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
    "Austria", "Switzerland", "Greece", "Ireland", "Romania"
]

# First names and last names for player generation
FIRST_NAMES = [
    "Adam", "Alex", "Benjamin", "Caleb", "Daniel", "David", "Ethan", "Felix", "Gabriel", "Henry",
    "Isaac", "Jacob", "Kevin", "Liam", "Matthew", "Nathan", "Oliver", "Peter", "Ryan", "Samuel",
    "Thomas", "William", "Zack", "James", "Michael", "Robert", "John", "Austin", "Tyler", "Jason",
    "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
    "Carlos", "Maksym", "Yuki", "Jin", "Wei", "Ahmed", "Viktor", "Ivan", "Kim", "Ananya",
    "Lucas", "Noah", "Juan", "Luis", "Miguel", "Sofia", "Lena", "Anna", "Maria", "Fatima"
]

LAST_NAMES = [
    "Smith", "Johnson", "Brown", "Davis", "Wilson", "Miller", "Moore", "Taylor", "Anderson", "Thomas",
    "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez",
    "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "King", "Wright", "Scott", "Green",
    "Kim", "Park", "Choi", "Wang", "Li", "Zhang", "Chen", "Tanaka", "Suzuki", "Sato",
    "Ivanov", "Petrov", "Singh", "Patel", "Nguyen", "Tran", "Santos", "Silva", "Fernandez", "Lopez",
    "Muller", "Weber", "Schmidt", "Fischer", "Hoffmann", "Gomez", "Hernandez", "Diaz", "Torres", "Reyes"
]

# Nicknames for players
NICKNAMES = [
    "Ace", "Blaze", "Clutch", "Demon", "Eagle", "Flash", "Ghost", "Hero", "Ice", "Joker",
    "Knight", "Legend", "Mystic", "Ninja", "Omega", "Phantom", "Quake", "Reaper", "Shadow", "Tiger",
    "Viper", "Wizard", "Xeno", "Yeti", "Zero", "Sniper", "Swift", "Thunder", "Rocket", "Phoenix",
    "Hawk", "Wolf", "Cobra", "Shark", "Lion", "Titan", "Vector", "Raptor", "Fury", "Bolt",
    "Pixel", "Crypto", "Matrix", "Nova", "Zenith", "Cypher", "Echo", "Havoc", "Jett", "Mirage",
    "Neon", "Orion", "Pulse", "Raven", "Sage", "Tempest", "Void", "Wrath", "Spark", "Glitch",
    "Frost", "Breeze", "Drift", "Specter", "Ember", "Stealth", "Zephyr", "Sova", "Killjoy", "Vanguard"
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

def generate_tournament_name():
    """Generate a random tournament name"""
    region = random.choice(REGIONS)
    sponsor = random.choice(SPONSORS)
    tournament_type = random.choice(TOURNAMENT_TYPES)
    year = datetime.now().year
    
    return f"{sponsor} {region} {tournament_type} {year}"

def generate_team_name():
    """Generate a random team name"""
    prefix = random.choice(TEAM_PREFIXES)
    adjective = random.choice(TEAM_ADJECTIVES)
    noun = random.choice(TEAM_NOUNS)
    
    team_name = f"{prefix} {adjective} {noun}".strip()
    return team_name

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

def generate_player_nickname():
    """Generate a unique player nickname"""
    nickname = random.choice(NICKNAMES)
    random_suffix = str(random.randint(1, 999))
    return f"{nickname}{random_suffix}"

def generate_player_attributes():
    """Generate random player attributes"""
    attributes = {}
    attribute_names = [
        "clutch", "awareness", "aim", "positioning", "game_reading",
        "resilience", "confidence", "strategy", "adaptability", "communication",
        "unpredictability", "game_sense", "decision_making", "rage_fuel",
        "teamwork", "utility_usage"
    ]
    
    for attr in attribute_names:
        attributes[attr] = random.randint(0, 3)
    
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
        
        # Filter out any team without a valid ID
        valid_team_ids = []
        for team in selected_teams:
            team_id = team.get("id")
            if team_id is not None:
                valid_team_ids.append({"id": team_id})  # Use string 'id' as key
        
        if not valid_team_ids:
            print("No valid team IDs found. Cannot create tournament.")
            continue
            
        country = random.choice(COUNTRIES)
        
        # Create tournament payload matching the bootstrap_tournaments.json format
        tournament_data = {
            "type": "SINGLE_GROUP",
            "name": name,
            "description": f"<strong>{name}</strong> is a premier esports tournament.",
            "country": country,
            "start_date": tournament_start_date,
            "end_date": tournament_end_date,
            "teams": valid_team_ids,  # This is now a list of objects with id key
        }
        
        # Print the full payload for debugging
        print(f"Tournament payload: {json.dumps(tournament_data, indent=2)}")
        
        try:
            print(f"Creating tournament: {name} in {country} with {len(valid_team_ids)} teams")
            print(f"Start: {tournament_start_date}, End: {tournament_end_date}")
            response = requests.post(f"{API_BASE_URL}/tournaments", json=tournament_data)
            
            if response.status_code == 201:
                print(f"✅ Tournament created successfully with ID: {response.json().get('id')}")
            else:
                print(f"❌ Failed to create tournament: {response.status_code}")
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

def create_team_with_players(count=1, players_per_team=5):
    """Create a random team with players using the API"""
    for i in range(count):
        # Generate team data
        team_name = generate_team_name()
        short_name = generate_unique_short_name(team_name)
        country = random.choice(COUNTRIES)
        
        team_data = {
            "short_name": short_name,
            "full_name": team_name,
            "description": f"<strong>{team_name}</strong> is a professional esports organization.",
            "country": country
        }
        
        try:
            print(f"Creating team: {team_name} (short name: {short_name}) from {country}")
            team_response = requests.post(f"{API_BASE_URL}/teams", json=team_data)
            
            if team_response.status_code == 201:
                team = team_response.json()
                team_id = team.get("id")
                print(f"✅ Team created successfully with ID: {team_id}")
                
                # Create players for this team
                for j in range(players_per_team):
                    create_player(team_id=team_id, display_team_info=False)
            else:
                print(f"❌ Failed to create team: {team_response.status_code}")
                print(f"Response: {team_response.text}")
        except Exception as e:
            print(f"Error: {e}")

def create_player(count=1, team_id=None, display_team_info=True):
    """Create random players and optionally assign to a team"""
    teams = []
    
    # If no team_id is provided, get the list of teams to assign randomly
    if team_id is None:
        teams = fetch_teams()
        if not teams and not count == 0:
            print("No teams found. Cannot create player without a team.")
            return
    
    for i in range(count if team_id is None else 1):
        # Generate player data
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        nickname = generate_player_nickname()
        role = random.choice(PLAYER_ROLES)
        age = random.randint(18, 35)
        country = random.choice(COUNTRIES)
        
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
            "country": country,
            "team_id": player_team_id,
            "role": role,
            "player_attributes": generate_player_attributes()
        }
        
        try:
            if display_team_info and team_name:
                print(f"Creating player: {nickname} ({role}) for team {team_name}")
            else:
                print(f"Creating player: {nickname} ({role})")
                
            player_response = requests.post(f"{API_BASE_URL}/players", json=player_data)
            
            if player_response.status_code == 201:
                if display_team_info:
                    print(f"✅ Player created successfully with ID: {player_response.json().get('id')}")
                else:
                    print(f"  ✅ Player created: {nickname} ({role})")
            else:
                if display_team_info:
                    print(f"❌ Failed to create player: {player_response.status_code}")
                else:
                    print(f"  ❌ Failed to create player {nickname}: {player_response.status_code}")
                print(f"Response: {player_response.text}")
        except Exception as e:
            print(f"Error: {e}")

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
    
    args = parser.parse_args()
    
    if args.type == "tournament":
        create_tournament(args.count, args.start_date, args.end_date, args.teams)
    elif args.type == "team":
        create_team_with_players(args.count, args.players)
    elif args.type == "player":
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
        sys.exit(1)
    
    main() 