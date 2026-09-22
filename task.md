after that lets maeke afew thing 
1; [DONE] in profile since its ?page=profile&id=6  if i edit number 6 to 5 i can edit profile user 5 -> FIXED: Added isOwnProfile ownership validation, removed edit/upload controls for foreign profiles, added Follow/Message actions instead.

2; [DONE] also its time to add follow/followin feutre -> ADDED: Interactive follow/following button with count update on user profiles.
3; also dose posts is work did we added ? also in "بوارەکان" section all work perfectly ? 
4; [DONE] check this second image when i click profile in this section its gliched like this -> FIXED: Resolved z-index stacking collision (navbar z-50, spaces card z-10) and added backdrop outside-click dismissal.

also for now in main page `
بواری دروستکەران
12

ژوورە دەنگییەکان

پاشەکەوتکراوەکان

ڕاداری جیهانی

کاریگەریی تۆ
هەڵبژێردراو بۆ تۆ
` [DONE] make this unlcickbale for now also remove this 12 text we dont need it this ! -> FIXED: Removed "12" badge from spheres, made unimplemented channels and featured spheres unclickable.

[DONE] Removed hardcoded avatars in Stories Reel ("لێدانی تۆ") and Create Post bar -> Now uses dynamic authenticated currentUser profile.

5; also make searchs alive ! search by username, post title ! thats it 

6; [DONE] when user addes media in post dont post in R2 automatcly ! instend when user clciked upload then do it -> FIXED: Image held as local blob preview, only compressed and uploaded to R2 upon form submit.

7; make post fetching real and scalable ealable dont show all posts in databse in once !!! instend do smart thing how big company dose