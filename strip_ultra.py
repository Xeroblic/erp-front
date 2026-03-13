import re

filepath = r"src\pages\refactor-technical-review\components\constants\Procesadores.ts"

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Clean the Family names: Core i9 / Ultra 9 -> Core i9
text = re.sub(r"nombre:\s*'Core (i\d)\s*/\s*Ultra\s*\d',", r"nombre: 'Core \1',", text)
text = re.sub(r"nombre:\s*'Core (i\d)\s*/\s*Core\s*\d',", r"nombre: 'Core \1',", text)

# 2. Find and remove specific generations containing Ultra or Core 3 100u
# The objects match the pattern { id: '...', ... modelos: [ ... ] }
# Since there are no nested braces inside 'modelos: []' other than { id, nombre }, 
# we can use a non-greedy regex to match the whole generation object:

gen_pattern = re.compile(
    r'\{\s*id:\s*\'(?:ultra[12]|core-2024)-[^\']+\',\s*nombre:.*?(?:Ultra|Serie Core).*?modelos:\s*\[.*?\]\s*\},?',
    re.DOTALL
)

# Apply replacement multiple times if needed (though DOTALL with non-greedy should work)
text = re.sub(gen_pattern, '', text)

# Just to be safe, there might be leading/trailing commas left in the code
# Let's clean up any empty spots or commas
text = re.sub(r',\s*,', ',', text)
text = re.sub(r'\[\s*,', '[', text)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Replacement complete.")
