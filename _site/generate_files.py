import os

names = [
    "David Legates", "Marlo Lewis", "Ben Lieberman", "John Ligon", "Evelyn Lim", 
    "Mario Loyola", "John G. Malcolm", "Joseph Masterman", "Earl Matthews", 
    "Dan Mauler", "Drew McCall", "Trent McCotter", "Micah Meadowcroft", 
    "Edwin Meese III", "Jessica Melugin", "Frank Mermoud", "Mark Miller", 
    "Cleta Mitchell", "Kevin E. Moley", "Caitlin Moon", "David Moore", 
    "Clare Morell", "Mark Morgan", "Hunter Morgen", "Rachel Morrison", 
    "Jonathan Moy", "Iain Murray", "Ryan Nabil", "Michael Nasi", "Lucien Niemeyer", 
    "Nazak Nikakhtar", "Milan 'Mitch' Nikolich", "Matt O'Brien", "Caleb Orr", 
    "Michael Pack", "Leah Pedersen", "Michael Pillsbury", "Patrick Pizzella", 
    "Robert Poole", "Christopher B. Porter", "Kevin Preskenis", "Pam Pryor", 
    "Thomas Pyle", "John Ratcliffe", "Paul Ray", "Joseph Reddan", "Jay W. Richards", 
    "Jordan Richardson", "Jason Richwine", "Shaun Rieley", "Lora Ries", 
    "Leo Rios", "Mark Robeck", "James Rockas", "Mark Royce", "Reed Rubinstein", 
    "William Ruger", "Austin Ruse", "Brent D. Sadler", "Alexander William Salter", 
    "Jon Sanders", "Carla Sands", "Robby Stephany Saunders", "David Sauve", 
    "Brett D. Schaefer", "Nina Owcharenko Schaefer", "Matt Schuck", "Justin Schwab", 
    "Jon Schweppe", "Marc Scribner", "Darin Selnick", "Josh Sewell", "Kathleen Sgamma", 
    "Matt Sharp", "Judy Shelton", "Nathan Simington", "Loren Smith", "Zack Smith", 
    "Jack Spencer", "Adrienne Spero", "Thomas W. Spoehr", "Peter St Onge", 
    "Chris Stanley", "Paula M. Stannard", "Parker Stathatos", "William Steiger", 
    "Kenny Stein", "Corey Stewart", "Mari Stull", "Katharine T. Sullivan", 
    "Brett Swearingen", "Michael Sweeney", "Robert Swope", "Aaron Szabo", 
    "Katy Talento", "Tony Tata", "Farnaz Farkish Thompson", "Todd Thurman", 
    "Brett Tolman", "Kayla M. Tonnessen", "Joe Trotter", "Tevi Troy", 
    "Clayton Tufts", "Erin Valdez", "Mark Vandroff", "Jessica M. Vaughan", 
    "John 'JV' Venable", "Morgan Lorraine Viña", "Andrew N. Vollmer", 
    "Hans A. von Spakovsky", "Greg Walcher", "David M. Walsh", "Erin Walsh", 
    "Jacklyn Ward", "Emma Waters", "Michael Williams", "Aaron Wolff", 
    "Jonathan Wolfson", "Alexei Woltornist", "Frank Wuco", "Cesar Ybarra", 
    "John Zadrozny", "Laura Zorc"
]

template = """---
layout: contributor
title: {name}
---

# {name}

Content for {name} goes here.
"""

output_dir = r"C:\Users\SirMo\OneDrive\Documents\github\new_approach2website\website2.0\_contributors"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

for name in names:
    # Create a filename based on the name
    filename = f"""{name.lower().replace(' ', '-').replace('.', '').replace("'", '')}.md"""
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(template.format(name=name))
