# clean.py  ▸ run once per raw CSV / new data pull
import pandas as pd, re, glob, pathlib

def standardise_cols(df):
    # Fix typos + enforce snake_case so formulas never break
    rename_map = {
        r'^flahes_': 'flashes_',
        r'^airbone_': 'airborne_',
        r'^infernos_': 'incendiaries_'
    }
    for pattern, repl in rename_map.items():
        df.columns = [re.sub(pattern, repl, c) for c in df.columns]
    # unify kd column
    if 'kd' not in df.columns and 'k_d' in df.columns:
        df.rename(columns={'k_d': 'kd'}, inplace=True)
    return df

def load_event(path):
    df = pd.read_csv(path)
    df = standardise_cols(df)
    # ensure numeric types
    num_cols = [c for c in df.columns if c not in ('steam_id','user_name','team_clan_name')]
    df[num_cols] = df[num_cols].apply(pd.to_numeric, errors='coerce')
    return df

def concat_events(folder='raw_events'):
    files = glob.glob(f'{folder}/*.csv')
    events = [load_event(f) for f in files]
    big = pd.concat(events, keys=[pathlib.Path(f).stem for f in files])
    big.to_parquet('clean/events.parquet')
    print(f'Saved {len(big)} player-event rows → clean/events.parquet')

# Allow running directly: python clean.py
if __name__ == "__main__":
    concat_events()