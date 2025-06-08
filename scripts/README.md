# VaValM Scripts

This directory contains utility scripts for the VaValM (Valorant Manager) application, designed to work with the actual API models and endpoints.

## Scripts Overview

- `localdb.sh` - Manages the local PostgreSQL database for development
- `docker-init.sh` - Initializes Docker containers for development
- `generate_data.py` - Generates sample data for testing and development
- `python_deps.sh` - Installs Python dependencies for scripts

## Data Generation Setup

1. Install Python dependencies:
   ```bash
   ./python_deps.sh
   ```
   
   Or manually:
   ```bash
   pip install -r requirements.txt
   ```

2. Make sure the VaValM API is running on http://localhost:8000.

## Data Generation Usage

The `generate_data.py` script can generate tournaments, teams with players, and individual players. It's a simple, executable Python script that properly interacts with the API.

### Generate Tournaments

```bash
# Generate a single tournament
./generate_data.py tournament

# Generate multiple tournaments
./generate_data.py tournament 5

# Generate a tournament with specific start and end dates
./generate_data.py tournament --start-date=2023-06-01 --end-date=2023-06-15

# Generate a tournament with a specific number of teams
./generate_data.py tournament --teams=8

# Generate a tournament with both custom dates and team count
./generate_data.py tournament 1 --start-date=2023-06-01 --end-date=2023-06-15 --teams=8
```

### Generate Teams with Players

```bash
# Generate a single team with 5 players
./generate_data.py team

# Generate a team with a specific number of players
./generate_data.py team --players=7

# Generate multiple teams
./generate_data.py team 3
```

### Generate Players

```bash
# Generate 5 players and assign them to random teams
./generate_data.py player 5

# Generate 3 players for a specific team
./generate_data.py player 3 --team=1
```

## Docker Management

The `docker-init.sh` script manages Docker containers for the application:

```bash
# Initialize Docker containers
./docker-init.sh
```

## Data Generator Features

### Tournament Generator

- Generates tournaments using the actual API model fields
- Creates random tournament names with sponsors, regions, and event types
- Randomly selects teams from the existing database
- Sets proper date ranges, types, and countries
- Provides clear success/failure messages for each operation
- Supports customizable start and end dates for tournaments
- Allows specifying the exact number of teams to include in a tournament

### Team Generator

- Creates teams with proper fields based on the API model
- Generates realistic team names and descriptions
- Creates players with appropriate roles and attributes
- Associates players with their teams
- Includes random player attributes for game characteristics

### Player Generator

- Creates individual players with realistic names and unique nicknames
- Generates random player attributes for all game characteristics
- Assigns players to existing teams (either randomly or specified)
- Supports multiple roles including specialized ones like Entry Fragger, Lurker, etc.

## Extending the Scripts

To extend these scripts:

1. Edit the desired script file
2. Add new functions or modify existing ones
3. Ensure the script remains executable:
   ```bash
   chmod +x script_name.sh
   ```

4. Test your changes by running the script 