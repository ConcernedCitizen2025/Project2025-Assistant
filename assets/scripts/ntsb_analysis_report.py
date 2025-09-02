import os
from PIL import Image, ImageDraw, ImageFont

# Define Output Directory
output_dir = r"C:\Users\SirMo\OneDrive\Documents\github\new_approach2website\website2.0\assets\ntsb_gov_source_data\analysis_reports"
os.makedirs(output_dir, exist_ok=True)

# Define Image Size (Landscape Letter Size: 11 x 8.5 inches at 300 DPI)
width, height = 3300, 2550  # 11 x 8.5 inches at 300 DPI
blue_bar_height = 200  # Height for the title bar

# Define Colors
blue_bar_color = (15, 32, 50)  # Dark Blue NTSB-like color
white_text_color = (255, 255, 255)  # White

# Define Fonts (Adjust paths if needed)
font_path = "arial.ttf"  # Default system font
font_large = ImageFont.truetype(font_path, 100)
font_medium = ImageFont.truetype(font_path, 60)
font_small = ImageFont.truetype(font_path, 40)

# --- Create Introduction Page ---
intro_img = Image.new("RGB", (width, height), "white")
draw = ImageDraw.Draw(intro_img)

# Draw Blue Title Bar
draw.rectangle([0, 0, width, blue_bar_height], fill=blue_bar_color)

# Add Title Text
title_text = "Aviation Safety Analysis Report\nJanuary Trends: 2007 - 2025"
draw.text((width // 2, blue_bar_height // 2), title_text, fill=white_text_color, font=font_large, anchor="mm")

# Add Main Body Text
intro_text = (
    "This report presents an independent analysis of aviation incident trends, using publicly available data\n"
    "from the National Transportation Safety Board (NTSB). It examines trends in incidents, fatalities, and injuries\n"
    "in the United States and worldwide for the month of January from 2007 through 2025.\n\n"
    "The data is sourced directly from the NTSB website (www.ntsb.gov). While the numbers reflect official records,\n"
    "this report is an independent analysis and should not be considered an official government document."
)
draw.text((width // 2, height // 2), intro_text, fill="black", font=font_medium, anchor="mm")

# Add Disclaimer
disclaimer_text = "Disclaimer: This report is based on publicly available NTSB data and is intended for informational purposes only.\nIt does not represent an official statement from any government agency."
draw.text((width // 2, height - 100), disclaimer_text, fill="black", font=font_small, anchor="mm")

# Save Introduction Page
intro_img.save(os.path.join(output_dir, "NTSB_Intro_Page.png"))

# --- Create Analysis Page ---
analysis_img = Image.new("RGB", (width, height), "white")
draw = ImageDraw.Draw(analysis_img)

# Draw Blue Title Bar
draw.rectangle([0, 0, width, blue_bar_height], fill=blue_bar_color)

# Add Title Text
title_text = "Analysis: FAA Cuts and Rising Fatalities"
draw.text((width // 2, blue_bar_height // 2), title_text, fill=white_text_color, font=font_large, anchor="mm")

# Add Analysis Text
analysis_text = (
    "The January 2025 aviation incident data reveals a troubling increase in fatal and serious injuries,\n"
    "despite a moderate number of total incidents compared to previous years. While aviation safety had been\n"
    "steadily improving in previous decades, the deregulation, staff reductions, and mismanagement under the\n"
    "current administration have reversed this trend.\n\n"
    "• The sharp rise in fatalities and injuries in January 2025 aligns with mass layoffs at the FAA and\n"
    "  the administration’s failure to appoint an FAA director in a timely manner.\n"
    "• This lack of oversight and staffing has led to increased risks for travelers, as seen in the unprecedented\n"
    "  number of air crashes within the first month of the new administration.\n"
    "• Elon Musk has positioned himself to capitalize on this crisis by proposing that SpaceX take over aspects\n"
    "  of air traffic control—a move that would privatize aviation safety and funnel billions into his own company.\n\n"
    "This situation follows a familiar pattern: public safety agencies are gutted under the pretext of efficiency,\n"
    "leading to crises that are then used as justification for privatization. The result is an aviation system\n"
    "where safety becomes secondary to profit, putting lives at risk.\n\n"
    "Musk’s attempt to shift air traffic control into private hands is not about increasing safety—it’s about profit.\n"
    "By weakening the FAA and then offering his own solution, he is manufacturing a crisis for personal gain.\n"
    "This reckless approach endangers American lives, and immediate action must be taken to restore oversight and accountability."
)
draw.text((width // 2, height // 2), analysis_text, fill="black", font=font_small, anchor="mm")

# Save Analysis Page
analysis_img.save(os.path.join(output_dir, "NTSB_Analysis_Page.png"))

print("✅ Introduction and Analysis Pages Successfully Created!")
