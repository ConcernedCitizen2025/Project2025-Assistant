#!/usr/bin/env python
"""
NTSB January Incident Report Generator

This script loads a JSON dataset from the NTSB website and processes the data to extract 
January counts for total incidents and injuries (Fatal, Serious, Minor) for the years 2007–2025.

It produces multiple PNG charts for each dataset (USA and Worldwide):
  • Grouped bar charts (years in ascending order from 2007 to 2025)
  • Line graphs showing trends across January data
  • Stacked bar charts displaying the breakdown of fatal, serious, and minor injuries
  • A combined spreadsheet‐style table (with rows sorted in descending order, 2025 at the top)
    showing both USA and Worldwide January data side‐by‐side
  • A new incident report table listing all January 2025 incidents that had any fatalities.
    This report shows each incident’s date, city, state, and the number of fatalities, serious, and minor injuries.

Data Source: https://www.ntsb.gov/
Note: Although the numbers are official, this report is not an official government document.

Required packages:
    pip install pandas matplotlib numpy
"""

import os
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime

# -----------------------------
# Constants & File Paths
# -----------------------------
DATA_FILE = r"C:\Users\SirMo\OneDrive\Documents\Politics\Planes\2007-01-01_through_2025-02-21_AviationData.json"
REPORT_OUTPUT_BASE = r"C:\Users\SirMo\OneDrive\Documents\github\new_approach2website\website2.0\assets\ntsb_gov_source_data\generated_reports"

# -----------------------------
# Data Loading & Preprocessing
# -----------------------------
def load_data():
    """Load the JSON data (UTF-8) and return a pandas DataFrame."""
    with open(DATA_FILE, 'r', encoding='utf-8', errors='replace') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    return df

def preprocess_data(df):
    """Convert EventDate to datetime and extract Year, Month, and Day."""
    df['EventDate'] = pd.to_datetime(df['EventDate'])
    df['Year'] = df['EventDate'].dt.year
    df['Month'] = df['EventDate'].dt.month
    df['Day'] = df['EventDate'].dt.day
    return df

# -----------------------------
# Aggregation Functions
# -----------------------------
def aggregate_month(df, target_month):
    """
    For the specified month (target_month), aggregate data by Year.
    Computes:
      - TotalIncidents (count)
      - Sum of FatalInjuryCount, SeriousInjuryCount, MinorInjuryCount
    """
    m_df = df[df['Month'] == target_month]
    agg = m_df.groupby('Year').agg(
        TotalIncidents=('Oid', 'count'),
        FatalInjuries=('FatalInjuryCount', 'sum'),
        SeriousInjuries=('SeriousInjuryCount', 'sum'),
        MinorInjuries=('MinorInjuryCount', 'sum')
    ).reset_index()
    return agg

def filter_usa(df):
    """Return a DataFrame filtered for incidents in the United States."""
    return df[df['Country'] == 'USA']

# -----------------------------
# Chart Functions
# -----------------------------
def plot_grouped_bar_chart(agg_data, report_label):
    """
    Create a grouped bar chart for January.
    Expects agg_data with columns: Year, TotalIncidents, FatalInjuries, SeriousInjuries, MinorInjuries.
    report_label should be either 'Worldwide' or 'USA'.
    The chart displays years in ascending order (2007 left → 2025 right).
    """
    agg_data = agg_data.sort_values(by='Year', ascending=True)
    years = agg_data['Year'].astype(str).tolist()
    x = np.arange(len(years))
    width = 0.2
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.bar(x - 1.5 * width, agg_data['TotalIncidents'], width, label='Incidents')
    ax.bar(x - 0.5 * width, agg_data['FatalInjuries'], width, label='Fatal')
    ax.bar(x + 0.5 * width, agg_data['SeriousInjuries'], width, label='Serious')
    ax.bar(x + 1.5 * width, agg_data['MinorInjuries'], width, label='Minor')
    ax.set_xlabel("Year")
    ax.set_ylabel("Count")
    ax.set_title(f"January Comparison ({report_label}) - Bar Chart", fontsize=14)
    ax.set_xticks(x)
    ax.set_xticklabels(years)
    ax.legend()
    ax.grid(axis='y', linestyle='--', alpha=0.7)
    return fig

def plot_line_chart(agg_data, report_label):
    """
    Create a line graph for January data.
    Plots TotalIncidents, FatalInjuries, SeriousInjuries, and MinorInjuries vs. Year.
    Years are in ascending order.
    """
    agg_data = agg_data.sort_values(by='Year', ascending=True)
    years = agg_data['Year'].tolist()
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.plot(years, agg_data['TotalIncidents'], marker='o', label='Incidents')
    ax.plot(years, agg_data['FatalInjuries'], marker='o', label='Fatal')
    ax.plot(years, agg_data['SeriousInjuries'], marker='o', label='Serious')
    ax.plot(years, agg_data['MinorInjuries'], marker='o', label='Minor')
    ax.set_xlabel("Year")
    ax.set_ylabel("Count")
    ax.set_title(f"January Comparison ({report_label}) - Line Graph", fontsize=14)
    ax.legend()
    ax.grid(True, linestyle='--', alpha=0.7)
    return fig

def plot_stacked_bar_chart(agg_data, report_label):
    """
    Create a stacked bar chart for January data, showing the breakdown of injuries.
    Only the injury counts (Fatal, Serious, Minor) are stacked.
    Years are in ascending order.
    """
    agg_data = agg_data.sort_values(by='Year', ascending=True)
    years = agg_data['Year'].astype(str).tolist()
    x = np.arange(len(years))
    fig, ax = plt.subplots(figsize=(12, 8))
    fatal = agg_data['FatalInjuries']
    serious = agg_data['SeriousInjuries']
    minor = agg_data['MinorInjuries']
    ax.bar(x, fatal, label='Fatal')
    ax.bar(x, serious, bottom=fatal, label='Serious')
    ax.bar(x, minor, bottom=fatal+serious, label='Minor')
    ax.set_xlabel("Year")
    ax.set_ylabel("Count")
    ax.set_title(f"January Comparison ({report_label}) - Stacked Bar Chart (Injury Breakdown)", fontsize=14)
    ax.set_xticks(x)
    ax.set_xticklabels(years)
    ax.legend()
    ax.grid(axis='y', linestyle='--', alpha=0.7)
    return fig

def create_combined_january_table(agg_jan_usa, agg_jan_world, title):
    """
    Create a combined table for January displaying both USA and Worldwide data side-by-side.
    The table has 9 columns:
      Column 1: Year
      Columns 2-5: USA data (Incidents, Fatal, Serious, Minor)
      Columns 6-9: Worldwide data (Incidents, Fatal, Serious, Minor)
    The header spans three rows:
      Row 1: ["Year", "JAN - USA", "", "", "", "JAN - Worldwide", "", "", ""]
      Row 2: ["", "Number of", "Injuries", "", "", "Number of", "Injuries", "", ""]
      Row 3: ["", "Incidents", "Fatal", "Serious", "Minor", "Incidents", "Fatal", "Serious", "Minor"]
    Data rows are sorted in descending order (2025 at the top down to 2007).
    """
    df_usa = agg_jan_usa.rename(columns={
        'TotalIncidents': 'USA Incidents',
        'FatalInjuries': 'USA Fatal',
        'SeriousInjuries': 'USA Serious',
        'MinorInjuries': 'USA Minor'
    })
    df_world = agg_jan_world.rename(columns={
        'TotalIncidents': 'WW Incidents',
        'FatalInjuries': 'WW Fatal',
        'SeriousInjuries': 'WW Serious',
        'MinorInjuries': 'WW Minor'
    })
    df_combined = pd.merge(df_usa, df_world, on="Year", how="outer").fillna(0)
    df_combined['Year'] = df_combined['Year'].astype(int)
    df_combined = df_combined.sort_values(by='Year', ascending=False)
    header1 = ["Year", "JAN - USA", "", "", "", "JAN - Worldwide", "", "", ""]
    header2 = ["", "Number of", "Injuries", "", "", "Number of", "Injuries", "", ""]
    header3 = ["", "Incidents", "Fatal", "Serious", "Minor", "Incidents", "Fatal", "Serious", "Minor"]
    data_rows = []
    for _, row in df_combined.iterrows():
        data_rows.append([
            str(int(row["Year"])),
            str(int(row["USA Incidents"])), str(int(row["USA Fatal"])), str(int(row["USA Serious"])), str(int(row["USA Minor"])),
            str(int(row["WW Incidents"])), str(int(row["WW Fatal"])), str(int(row["WW Serious"])), str(int(row["WW Minor"]))
        ])
    table_data = [header1, header2, header3] + data_rows
    fig, ax = plt.subplots(figsize=(16, max(4, 0.4 * (len(data_rows) + 3))))
    ax.axis('off')
    table = ax.table(cellText=table_data, loc='center', cellLoc='center')
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1, 1.5)
    ax.set_title(title, fontweight="bold", fontsize=14, pad=20)
    return fig

# -----------------------------
# New Report: Incidents in January 2025 with Fatalities
# -----------------------------
def create_fatality_report_2025(df):
    """
    Create a report listing all incidents in January 2025 that had any fatalities.
    The report table includes:
      - EventDate (date)
      - City (as a proxy for departure/destination)
      - State
      - FatalInjuryCount, SeriousInjuryCount, MinorInjuryCount
    Only rows with FatalInjuryCount > 0 are included.
    """
    # Filter for January 2025 incidents with fatalities.
    df_2025 = df[(df['Year'] == 2025) & (df['Month'] == 1) & (df['FatalInjuryCount'] > 0)]
    if df_2025.empty:
        print("No January 2025 incidents with fatalities found.")
        return None
    
    # Select columns to display. Adjust field names if necessary.
    report_cols = ['EventDate', 'City', 'State', 'FatalInjuryCount', 'SeriousInjuryCount', 'MinorInjuryCount']
    df_report = df_2025[report_cols].copy()
    # Format the date.
    df_report['EventDate'] = df_report['EventDate'].dt.strftime("%Y-%m-%d")
    df_report = df_report.sort_values(by='EventDate', ascending=False)
    
    # Build table data.
    header = list(df_report.columns)
    data_rows = df_report.astype(str).values.tolist()
    table_data = [header] + data_rows
    
    fig, ax = plt.subplots(figsize=(16, max(4, 0.4 * (len(data_rows) + 1))))
    ax.axis('off')
    table = ax.table(cellText=table_data, loc='center', cellLoc='center')
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1, 1.5)
    ax.set_title("January 2025 Incidents with Fatalities", fontweight="bold", fontsize=14, pad=20)
    return fig

# -----------------------------
# Saving Figures (PNG only)
# -----------------------------
def save_figures(fig_list, report_title, output_folder):
    """Save each figure as a PNG file."""
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    for i, fig in enumerate(fig_list):
        png_path = os.path.join(output_folder, f"{report_title}_figure_{i+1}.png")
        fig.savefig(png_path, dpi=300, bbox_inches='tight')
        print(f"Saved PNG: {png_path}")

# -----------------------------
# Report Generation
# -----------------------------
def generate_reports():
    # Load and preprocess data.
    df = load_data()
    df = preprocess_data(df)
    # Filter USA data.
    df_usa = filter_usa(df)
    # Aggregate January data.
    agg_jan_world = aggregate_month(df, 1)
    agg_jan_usa = aggregate_month(df_usa, 1)
    # Create charts for USA.
    fig_bar_usa = plot_grouped_bar_chart(agg_jan_usa, "USA")
    fig_line_usa = plot_line_chart(agg_jan_usa, "USA")
    fig_stack_usa = plot_stacked_bar_chart(agg_jan_usa, "USA")
    # Create charts for Worldwide.
    fig_bar_world = plot_grouped_bar_chart(agg_jan_world, "Worldwide")
    fig_line_world = plot_line_chart(agg_jan_world, "Worldwide")
    fig_stack_world = plot_stacked_bar_chart(agg_jan_world, "Worldwide")
    # Create combined January table.
    fig_combined_table = create_combined_january_table(agg_jan_usa, agg_jan_world, "January Incident Summary (2007 - 2025)")
    # Create the new fatality report for January 2025.
    fig_fatality_report = create_fatality_report_2025(df)
    # Compile figures (exclude pie charts).
    figures = [
        fig_bar_usa, fig_bar_world,
        fig_line_usa, fig_line_world,
        fig_stack_usa, fig_stack_world,
        fig_combined_table
    ]
    # Append the fatality report if available.
    if fig_fatality_report is not None:
        figures.append(fig_fatality_report)
    
    today_str = datetime.today().strftime("%Y-%m-%d")
    output_folder = os.path.join(REPORT_OUTPUT_BASE, today_str)
    save_figures(figures, "NTSB_January_Report", output_folder)
    plt.show()

# -----------------------------
# Main Execution
# -----------------------------
if __name__ == "__main__":
    generate_reports()