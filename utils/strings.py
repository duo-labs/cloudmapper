# Slugifies a string, e.g.  "My IAM account" => "my-iam-account"
def slugify(str):
  allowed_characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
  new_string = []
  for i in range(len(str)):
    char = str[i]
    if char not in allowed_characters:
      char = '-'
    new_string.append(char)

  return ''.join(new_string).strip().lower()

