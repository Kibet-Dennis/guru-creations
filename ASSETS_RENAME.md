Changes made in code reference:

- HTML/CSS/JS now reference normalized asset filenames (spaces -> hyphens, lowercase) for consistency.
- Examples: `Assets/logo 1.png` -> `Assets/logo-1.png`, `Assets/Featured products/Website photo.jpg` -> `Assets/featured-products/website-photo.jpg`, `Assets/hero 2.0.mp4` -> `Assets/hero-2.0.mp4`.

What you must do locally (one-time):


1. Backup your repo or commit current changes.
2. (Optional but recommended) Create a ZIP backup of the `Assets/` folder:

   Open PowerShell in the repository root and run:

   cd "c:\Users\denni\OneDrive\Desktop\coding space\guru-creations"
   .\scripts\backup-assets.ps1

3. Run the provided PowerShell script to rename files and folders to match the updated references:

   .\scripts\normalize-assets.ps1

4. Verify the `Assets/` folder now contains lowercase, hyphenated names and subfolders like `featured-products`.
5. Test the site locally (open `index.html` and `portfolio.html` in browser) and fix any remaining paths if necessary.

If you'd like, I can also:
- Create a backup copy of the original `Assets/` folder (zip) before renaming.
- Automatically update any remaining references I missed.
