-- registered users. the password is stored as a hash (scrypt) + salt.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL
);

-- lines
CREATE TABLE IF NOT EXISTS lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- stations
CREATE TABLE IF NOT EXISTS stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- station-line connections. stations on multiple lines are transfer stations
CREATE TABLE IF NOT EXISTS station_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  line_id INTEGER NOT NULL,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (line_id) REFERENCES lines(id),
  UNIQUE (station_id, line_id)
);

-- adjacent stations on a specific line. segments can be traveled in both directions.
CREATE TABLE IF NOT EXISTS segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_id INTEGER NOT NULL,
  station_a_id INTEGER NOT NULL,
  station_b_id INTEGER NOT NULL,
  FOREIGN KEY (line_id) REFERENCES lines(id),
  FOREIGN KEY (station_a_id) REFERENCES stations(id),
  FOREIGN KEY (station_b_id) REFERENCES stations(id)
);

-- random events that can happen during execution
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  effect INTEGER NOT NULL
);

-- games played by registered users. status can be setup, planning, execution, or completed.
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  start_station_id INTEGER NOT NULL,
  end_station_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'setup',
  planning_deadline TEXT,
  score INTEGER NOT NULL DEFAULT 20,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (start_station_id) REFERENCES stations(id),
  FOREIGN KEY (end_station_id) REFERENCES stations(id)
);

-- ordered segments chosen during planning. event_id and effect_applied are filled during execution
CREATE TABLE IF NOT EXISTS game_segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  segment_id INTEGER NOT NULL,
  step_order INTEGER NOT NULL,
  event_id INTEGER,
  effect_applied INTEGER,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (segment_id) REFERENCES segments(id),
  FOREIGN KEY (event_id) REFERENCES events(id)
);