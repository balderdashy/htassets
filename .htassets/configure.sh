# Location of .htassets relative to web root
# (if you put .htassets in your web root, leave this as '/')

# YOU MUST INCLUDE TRAILING SLASH!!!
htasset_location='/'


###############################################################

# Escape forward slashes
escape_regex='s/\//\\\//g'
escaped_location=`echo $htasset_location | sed $escape_regex`

# cd into this script's directory so that this works from anywhere
cd "$( cd "$( dirname "$0" )" && pwd )"


# Overwrite .htaccess file with correct dir
part1='s/{{{root}}}/'
part2='/g'
sedCommand="${part1}$escaped_location"
sedCommand="${sedCommand}$part2"
sed "$sedCommand" templates/.htaccess.template > ../.htaccess

# Overwrite header.html
sed "$sedCommand" templates/header.template > header.html

# Overwrite constants.js
sed "$sedCommand" templates/constants.template > constants.js