# Timezone Helper

Convert times between timezones, find current time in any city, and format times for international coordination.

## Usage

```bash
# Current time in a timezone
node timezone.js now "America/Los_Angeles"
node timezone.js now "Tokyo"

# Convert a time between zones
node timezone.js convert "3:30 PM" "America/New_York" "Europe/London"
node timezone.js convert "14:00" "UTC" "America/Chicago"

# List common timezones
node timezone.js list

# Find timezone by city/country
node timezone.js find "Berlin"
node timezone.js find "Australia"
```

## Output Formats

All commands output JSON for easy parsing:

```json
{
  "input": "3:30 PM",
  "from": "America/New_York",
  "to": "Europe/London", 
  "result": "8:30 PM",
  "offset": "+5 hours"
}
```

## Common Timezones

- `America/New_York` - US Eastern
- `America/Chicago` - US Central
- `America/Denver` - US Mountain
- `America/Los_Angeles` - US Pacific
- `Europe/London` - UK
- `Europe/Paris` - Central Europe
- `Europe/Berlin` - Germany
- `Asia/Tokyo` - Japan
- `Asia/Shanghai` - China
- `Australia/Sydney` - Australia Eastern
- `UTC` - Coordinated Universal Time

## Use Cases

- Schedule meetings across timezones
- Tell users what time it is somewhere
- Convert deadline times for international teams
- Find the best overlap time for calls
