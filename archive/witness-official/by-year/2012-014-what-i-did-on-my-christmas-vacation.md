# What I Did on My Christmas Vacation

- **作者**：Jonathan Blow
- **日期**：2012-12-30 23:34 UTC
- **分类**：Development
- **原文**：http://the-witness.net/news/2012/12/what-i-did-on-my-christmas-vacation/
- **来源**：the-witness.net 官方开发博客（文章页全文）

---

I apologize in advance that this posting is a rambling mess.

**The Background**

Way back in 2008 when I came upon the core idea of this game, the design was the exciting part. Though I started in games mainly as a technical person who was excited about technical challenges, I have shifted into a mode of thought where, when I program, it's mainly just to get the design done in the most straightforward way.

Since Braid I have viewed programming as mostly pragmatic: I know what I want to do, and I know what kinds of things I have to type in to make it happen, but for the most part, the interesting mental challenges are in design, and programming is rote execution. Once you have enough programming experience, I think 95% of writing a big program is like this. There have been a few times during *The Witness* when I spent significant effort solving technical problems where I had no idea what the answer would be in advance, [like with the terrain manipulation,](http://the-witness.net/news/2010/05/kriging-is-cool/) but even in these cases I treated the technical development in a very pragmatic way: the goal was to get something that is good enough for current needs, not to design a shining jewel of an amazing technical system (back when I was a younger game programmer, I was trying to make amazing technical systems all the time, and it came at the cost of actually getting games done).

Despite the fact that I am trying to focus on design, in order to make this game a reality, I had to start a company, bring people onto the project to build the game, etc. This means that nowadays I am not just wearing the programmer and designer and business development hats, I also wear the producer hat and the (admittedly small at present) HR hat. Maybe if The Witness does well, we can expand the team a little bit so that I don't have to do these things, but for now, that's the reality.

We are very laid back and unstructured in the way we do things, but even so, I feel there's a heavy subconscious load involving running the company, making sure nobody's work is blocked, dealing with money all the time, etc. I often find it hard to do deep design thinking when I am in the office, if only because all these issues are just ambiently around. So, in terms of design, my most productive days tend to be work-from-home days (which for me includes most weekends).

All this up til now is just to explain that if I take a vacation seriously, it can be very relaxing, because that subliminal load is gone, or at least mitigated for a while. The activity of the rest of the company is mostly paused, which removes urgency from my own activities.

At first I didn't know how I would spend vacation; at first I thought maybe I would actually treat it the way most people treat vacation, and not work. Then I thought, hmm, there is a certain sector of the game that I might like to work on, that is definitely very important, and I should get a bunch of that done while everyone is gone, so that when they come back it will be figured out. (I don't want to go into detail about what that section of the game is, because I am avoiding spoilers).

**The Vacation**

But, inspiration is a funny thing. I worked a little bit on the issues I had planned to work on, but for the first bit of the vacation, up through the 25th, I found myself most motivated by cleaning up old nagging issues on my to-do list, and shipping this improved version of the game to our very few beta players. This involved stuff like improving the feel of tracing lines on the puzzle panels.

[![A peek at the export script, used to package the game for end-users.](http://the-witness.net/news/wp-content/uploads/2012/12/export-476x384.png)](http://the-witness.net/news/wp-content/uploads/2012/12/export.png)

A peek at the export script, used to package the game for end-users.

After shipping that beta, I found my attention most strongly drawn toward an unexpected part of the game: an optional area, one that we could completely cut from the game and nobody would know, yet at the same time, it's an area that adds to the overall conceptual arc of the game in a strong way, and would be very rewarding for the small percentage of players who get deeply into the game. (Again, I apologize for the vagueness, but let's avoid spoilers).

I had roughed out a version of this area a long time ago -- maybe a year or two ago -- and had always found the basic idea very exciting. But back then the area wasn't done enough to prove the concept, and over time it decayed while the rest of the game was being worked on (which is natural on a big project like this). But, perhaps because it's an area of the game that nobody else on the team really knows about or understands yet, I had a great motivation to spend vacation time on making this area good. Now that I think about this again it makes a strange kind of sense: when development is pretty much paused, it is somehow appropriate to work on something that nobody else really knows about.

At first I thought the task would just be to make the old stuff work again and then do a straightforward job of the extra functionality I needed to complete the area. Thinking about the programming I would have to do to complete the area, I saw it as a necessary bummer ("I want to be done with this game, but ugh, there is more programming I have to do that isn't even on the mainline to all the things that really need to be done.")

But I started programming that extra functionality, and 10 minutes into it, realized I was not so excited about the design part -- it seemed like a very rote execution, like anyone could do in any game, and The Witness ought to have something better than that. Because there was no pressure, and because I was free to do whatever I wanted, my mind was open enough to instantly see an alternative that would be much truer to the essence of the game. The chance to do this better thing was very exciting. (We'll come back to this subject of being able to see ideas, later).

So I started programming this more-exciting version of the functionality. Then I saw how I could make it even more interesting, and I would start doing that. Then I would see how to make it even *more* interesting, though that would introduce a lot more programming work. If I were feeling the regular pressure of the game schedule, at this time years in when it is time to be finishing the game, I might have said, "naah, we don't have time add that extra work". But because it was vacation the work was free, so I said screw it.

I worked in a fiercely productive way for a couple of days. New ideas would come. They would raise new issues. I would program some things, and in that way that programming often goes, new problems would come to light that I hadn't thought of, and those problems introduced even smaller 2nd-order problems when confronted. But by this time I was fully energized and just had dogged determination and was fully enjoying the whole process. In the end I programmed at least 5 times as much functionality as I had planned, but rather than being bummed about it, I enjoyed the whole excursion.

Those who know me will tell you that I am not predisposed toward painting things in an unduly positive light -- but I will tell you that these past four days or so have been amazing and wonderful. Here's a shot from what I did (the visuals are 'programmer art', as usual):

[![shot_2012.12.29__time_20_51_n06](http://the-witness.net/news/wp-content/uploads/2012/12/shot_2012.12.29__time_20_51_n06-512x288.png)](http://the-witness.net/news/wp-content/uploads/2012/12/shot_2012.12.29__time_20_51_n06.png)

It is hard to tell you why this is so cool without huge spoilers.

**It's so amazing and wonderful because**

it's been a long time since I worked this hard and this effectively. Keeping in mind that memory is sometimes not as reliable as we think, I would tell you that the last time I worked this hard and this well was when starting my first, ultimately doomed, company (with a friend from college and a 3D artist we recruited from that same school and unfortunately put through years of meager-wage toil).

Here are some shots from the first professional game I ever worked on, back before we had a concept of 'indie development'. Software rendered, subpixel-accurate texture mapping, assembly-language inner loop that commandeers ebp in order to utilize a precious extra register, a la Mike Abrash, and oh yeah, it was multiplayer-only, 32-player, over 9600 baud modems:

[![wulfram.2](http://the-witness.net/news/wp-content/uploads/2012/12/wulfram.2-512x384.jpg)](http://the-witness.net/news/wp-content/uploads/2012/12/wulfram.2.jpg)

[![Wulfram 2](http://the-witness.net/news/wp-content/uploads/2012/12/Wulfram-2-512x384.jpg)](http://the-witness.net/news/wp-content/uploads/2012/12/Wulfram-2.jpg)

We were working on this game from 1996 to 1999 or so. 1996 was the year I got into professional game development, and in hindsight, it appears to have been the hardest possible time in the history of video games. Indies of today, y'all have *no idea* how much easier it is to make games now than it was in 1996. (I hate to be an old fogey who's all "back in my day, we had to walk to school in the snow, barefoot, uphill both ways," but in this case it is absolutely true.)

That game was never very successful. It had design problems, but also, we didn't really know how to talk about or promote a game; lastly, this was before many people played games over the internet, so the potential audience was pretty small. (Trivia Tidbit: [There was another online game being supported by the same publishing service as our game](http://en.wikipedia.org/wiki/Attack_Retrieve_Capture), and this other game was more popular, despite being relatively simple in a technical sense, which annoyed the hell out of us on a subliminal level that we wouldn't totally admit. The guys making this game were John Vechey and Brian Fiete; our producer at the publisher was Jason Kapalka, who later went off with these guys to start a company called PopCap, which last I heard had done okay.)

Back in those days I worked very hard. When we started the company I knew nothing about building 3D games; we learned very quickly. I would long hours, late into the night, intensively. At some point we all burned ourselves out, I think.

After we closed down that company, I went on to do a number of contractor things, game industry lecture things, magazine article things, and working on various independent projects that I never finished. Through that time, I was still very burned out. If you have never experienced burnout, it's hard to explain. Burnout is not just "I don't feel like working right now"; it is about your mind refusing to permit you to work, because it has seen what happens when it lets you work.

Eventually, I swore that I would design a very good game and finish it and release it to people, and the result is a game that was successful and that many people like:

[![Braid_screenshot2](http://the-witness.net/news/wp-content/uploads/2012/12/Braid_screenshot2-512x288.jpg)](http://the-witness.net/news/wp-content/uploads/2012/12/Braid_screenshot2.jpg)

A main part of the reason this game exists was that I instilled a certain discipline in myself: I wasn't going to do this game because I was excited about a technical thing, or excited about programming; I was going to minimize the amount of programming, firstly so that the game would get finished at all (I had plenty of experience by this point at not-finishing-projects, as did many of my friends; it was an endemic problem), but also so that I could focus appropriately on the design and build something very special.

Despite the fact that I kept the game technically simple, there was still a huge amount of programming to do. But thankfully, the strategy worked and the game was completed. Eventually.

Even though I'd made a successful game, I was still burned out to some degree. In 1996-1997 I was working at full capacity and was very productive, at least inasmuch as one might expect for a programmer of that age who was first starting to get real-world large-project experience. But after being burned out at that time, I never again worked at full capacity.

**What I am getting at**

I am saying all these things just as a way to get around to explaining that, during this Christmas vacation, I finally recovered fully from burnout. For about 3 days, I was working at 100% capacity, which I have not done in 15 years. It felt wonderful to have that back, to not succumb to the story that maybe game design and programming are like math of physics where you peak at 25. These few days were way better than when I was 25, because now I am substantially better at programming, and I am good at design also, and games are so much easier to make than they used to be; so the design cylinders are firing and then they turn it over to the programming cylinders, etc, and very quickly a lot of high-quality work gets banged out. And it's not just arbitrary good work, but work that helps to round out the game that I already feel is the best thing I have ever worked on, that helps put grace notes in just the right places, in the [manner of exploratory game design](http://www.youtube.com/watch?v=OGSeLSmOALU) that Marc ten Bosch and I spoke about at Indiecade 2011. So this period of intensive work was seasoned and tempered in a way that was not possible when I was 25.

It has been a wonderful time and I look forward to doing more of it. Part of what allowed it to happen this way was that lack of pressure that I have mentioned, due to being on vacation. When a design idea would come to mind, and I would see that it might be cool but would lead to a lot of work, well, this week I was able to let it happen, and I was able to enjoy the challenge of going off on a minor programming rathole in order to do something really good in the design. This is to some degree a reversal of the discipline I instilled to get Braid done; you can think of it as a correction term to the equation. The 0th order term is knowing how to program and design; the 1st order term is having discipline to be able to execute efficiently without being carried away with ideas that will scuttle production; but the 2nd order term is that it is joyful and interesting to have some wiggle room in there, sometimes eroding away a bit of the 1st order term.

There is a kind of open curiosity about programming that I haven't had in a long time, that I allowed myself to re-discover this week in the freedom of exploring that 2nd-order term.

([Richard Feynman has an anecdote about how he was burned out on physics](http://www.physics.ohio-state.edu/~kilcup/262/feynman.html), and how he started to get over it, which I think bears some similarity).

I am not explaining any of this very well. But I am doing the best work of my life, right now, and it feels great, and for the first time I could see myself working in this same fashion for the rest of my life and feeling happy that I am operating at something like my full potential. So there you have it.

I mentioned earlier that I would talk further about the ability to see ideas, but I guess I was lying, because this is already too long and rambling. I'll save that for a future post.

*It's worth pointing out that I started Braid while working on what was supposed to be a vacation. And back when I got the impulse to start the Experimental Gameplay Workshop, I was on a plane back from a vacation to Africa. So apparently vacations are good times for me, even if I don't treat them the way Normal People do.*
