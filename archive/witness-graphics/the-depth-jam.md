# The Depth Jam

- **作者**：Jonathan Blow
- **日期**：2012-05-29
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/the-depth-jam/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）

---

[![](http://the-witness.net/news/wp-content/uploads/2012/05/DSCN0920-512x384.jpg)](http://the-witness.net/news/wp-content/uploads/2012/05/DSCN0920.jpg)

Last week, I got together with three other designers for a four-day intensive design retreat known as the Depth Jam.  The other attendees were: [Chris Hecker of Spy Party](http://chrishecker.com), [Marc ten Bosch of Miegakure](http://marctenbosch.com/), and [Daniel Benmergui of Storyteller](http://www.ludomancy.com/blog/).

This event was an experiment.  Chris and I had been discussing the idea for a while, but it took us a couple of years to get around to it.  One of my personal goals in setting up this event was to find a new way to stimulate my professional development, because the old ways were not cutting it any more.

The Depth Jam was designed in reaction to shortcomings of other game-related events.  *In order to explain the design choices behind the Depth Jam, I will speak critically of these other events, in order to highlight the problems that the Depth Jam is meant to address.*  If you are a fan of these events, organize some of them, or otherwise identify closely with them, then this will be uncomfortable.  The best I can do here is to assure you that this isn't attack-style negativity; it is criticism that comes from years of carefully considering these situations and thinking hard about how to make things better.

### Conferences

When I first started working in video games I learned a lot from conferences and lectures.  The few days I spent at the Computer Game Developers' Conference in 1996 were eye-opening, even though I wasn't comfortable enough as a game developer to know how to make effective use of that time.  As years go by and we get better at what we do, a natural shift occurs: in the beginning, we are mostly deriving benefit from other attendees and presenters; later on, we are mostly providing benefit to other attendees, getting little out of it ourselves.  I have been to the Game Developers Conference 17 times now.  I find that I still do get something from attending, but it really takes a lot of work and there are very few people I can expect to learn from.

All the smart programmers I know complain about conferences and consider them basically useless (except for the smart programmers who are also on conference advisory boards).  I certainly developed this kind of frustrated "there's nothing good here to see" attitude in the early 2000s, but to mitigate this situation I shifted into being much more of a conference presenter than an attendee.  A lot of creative energy went into planning new conference sessions and making them good.  This helped extend the useful life of conferences, because I was learning a great deal by running sessions.  After about eight years, though, this ran its course and I had gotten the bulk of what I was going to get from this arrangement.

### Game Jams

In a typical game jam, developers gather for 2-4 days to do a working sprint, the goal being to produce a finished game entirely during the event.  I was lucky enough to be around for the [Indie Game Jam](http://www.indiegamejam.com/), which probably started the game jam trend (though I was often too busy working on last-minute GDC lectures to make jam games, sadly!)

[![](http://the-witness.net/news/wp-content/uploads/2012/05/IMG_1940-512x384.jpg)](http://the-witness.net/news/wp-content/uploads/2012/05/IMG_1940.jpg)

From the first Indie Game Jam.  Pictured: Brian Jacobson, Sean Barrett, Ken Demarest, Charles Bloom, Jonathan Blow, Brian Sharp, Doug Church.

The Indie Game Jams were very different from the jams we see today.  The IGJ was founded on the idea of exploring the design ramifications of a crazy technical question; we would provide attendees with some code to accomplish some technical feat, then they would see where that would lead in terms of design.  For example, the question for the first IGJ was "Graphics hardware is pretty fast now; what will people design if we give them an engine that can draw 100,000 little sprite guys on the screen at once?"  We were picky about who we invited: attendees had to be designer-programmers who were actually good at programming, because dealing with new technology on a short timeframe can be very challenging.

[![](http://the-witness.net/news/wp-content/uploads/2012/05/IMG_1955-512x384.jpg)](http://the-witness.net/news/wp-content/uploads/2012/05/IMG_1955.jpg)

Also from the first Indie Game Jam.  Pictured: Art Min, Charles Bloom, Robin Walker, Thatcher Ulrich, Brian Jacobson, Zack Booth Simpson, and ... I don't know, Justin Hall?  Charles Bloom again?

In contrast, contemporary game jams are more open.  The idea is that it's great to make a game, any game, and that even if you don't manage to finish, you were still part of a community.  This community spirit is often upheld as the best part of a game jam.

I think these jams can be really nice for beginners, to show people that making a game is something within reach, and to help them meet other people interested in making games.  For experienced developers, though, I think these jams are not so good, because the jams are part of an overall social context that supports stagnation.

Experienced developers would do well to continually hone their craft and push beyond their comfort zone, but jams celebrate low expectations and provide Warm Community Feelings that create a comfort coccoon.  "You made a game that is not very interesting?  You didn't finish a game at all?  Well, you are still part of a community that likes you because you are participating in a game jam, and that is what is truly important."

I don't think there is anything inherently wrong with desiring a feeling of community, but we must take care to separate the notion of participating in the community from the notion of success.  Participating in a game jam is not an indicator of success at game development -- nor is attending the Independent Game Summit or Indiecade.  I think that nice feelings are nice, but you want to build an ecosystem where the nice feelings coincide with behavior that will make developers robust and powerful and interesting in the long term.  You don't want nice feelings to act as a soporific.  Activities that are good for beginners are often stagnant for intermediate developers.

What to do about this?  I think if there were a category of game jams with higher expectations, so that advanced jams were differentiated from beginner jams, that would be a nice start.  The IGJ model definitely asked more of participants, but I don't think the IGJ is the right thing going into the future, because even if you are playing with challenging technology, the time-limited format prevents you from going deep.  IGJ was nice in 2002, but today it would just contribute further to the problem outlined in Chris Hecker's rant [Please Finish Your Game](http://chrishecker.com/Please_Finish_Your_Game).  We see lots of wacky but shallow game designs all over the web, and it feels like a problem, or at least a vast sea of potential unreached.

As Chris says in his [write-up about the Depth Jam](http://chrishecker.com/The_Depth_Jam), "game jams are shallow by design."  Because they are shallow, I don't feel they are the right place for me to develop as a game design practitioner.

### Retreat-Like Gatherings

There have been a few retreat-like gatherings for forward-thinking game designers: see for example [Project Horseshoe](http://www.projecthorseshoe.com/) and [Phrontisterion](http://www.erasmatazz.com/TheLibrary/Phrontisterion/Phrontisterion.html).  I have never been to these.  I like the basic idea behind these kinds of events, but the execution seems to have endemic problems. I know people who have been to both of these events, but when I ask, they do not recommend attending the events.  Certainly I have found [Project Horseshoe's written reports](http://www.projecthorseshoe.com/reports.htm) unhelpful.

The obvious problem with these events is that they are mostly just a bunch of talking.  When people get together for a bunch of talking, most of them just say a bunch of bullshit (here I mean bullshit [in the Harry G. Frankfurt sense](http://press.princeton.edu/titles/7929.html)) that is unfocused and untethered to reality.  If it is not of critical importance whether what people say is right, then most of it is not going to be right.

I really like the retreat model as a basic template.  Over the past few years I've been to a number of retreats, mostly for things like meditation or silent existential contemplation.  There's a lot good about going to a far-away place where you are not bothered by the concerns of everyday life.  But looking at Phrontisterion and Horseshoe, the question arises: how does one design a retreat like this that is not just a bunch of talking?

I knew some of the answer, because I've seen success in dealing with a similar question in a neighboring realm:

### Local Developer Meet-Ups

Many cities around the world have regular meet-ups; once a month or so, game developers get together at a bar or something, and just chat and be social.  I generally don't go to these because bars are antagonistic to interesting conversations and because attendees tend toward the neophyte side, which means we have the same problem as at conferences: there's little benefit to be had for an experienced developer.  But these events also have the Horseshoe problem, in that the conversation is not focused and doesn't really matter, so people just say a bunch of nonsense.  If all you want is to get drunk and be social, these events are fine, but they don't do much for professional development.

Two years ago I started a series of monthly developer meetups in the San Francisco Bay Area; the idea was to keep discussion quality high by (a) holding the meetings in quiet places conducive to good discussion, like someone's house  (b) inviting only active game designers [this was not a "game industry" meeting, it was a "thoughtful game designer" meeting], and  (c) starting each meeting with one of the attendees presenting their own work.  After the presentation, we discuss that work specifically for a while; then at some point, the discussion naturally dissolves into separate, more-general discussions.

(I have been to some developer meet-ups that also began with presentations, but which to me did not manage to establish a culture of quality.  One example was the Austin IGDA meetings back in 2002-2003.  I think there were many subtle things preventing quality from rising, mostly having to do with intention of the event: the goal of the meeting was to drive attendance, not to be deeply interesting; also, they were "game industry" meetings, with all the associated issues.  Also, scale matters: the Austin IGDA meetings were bigger, and they occurred in offices or at places like Dave & Buster's, which did not encourage a personal connection to the presentation or the other attendees).

The meetings in the Bay Area were very successful at keeping discussion quality relatively high.  The situation wasn't perfect, but it was much better than your typical bar meeting.  (I would have attended these regularly even if I were not involved in organizing them).   Other attendees really enjoyed the meetings as well.  After about a year, though, I stopped arranging the meetings because we seemed to have exhausted the supply of people willing to present, and I didn't want to start having meetings that were not kicked off by solid presentations.  Because everyone had a good time, there's a reasonable probability that in the future we will pick these up again.  I think we might be able to improve the discussions further by reducing the presenter-vs-audience asymmetry somehow (see the Depth Jam section below).

Key to the success of these events was having specific, concrete issues to talk about: a specific game being presented, so that discussion could be anchored to the details of that specific game.  It's also important that the game was being presented by its author; if the session is just someone talking about someone else's game that they liked or didn't like or just want to say something about, it is too easy for the discussion to be useless bullshit.

It seemed like this model could be applied to ground a retreat so that it would not just be a bunch of talking.

[![](http://the-witness.net/news/wp-content/uploads/2012/05/DSCN0958-512x384.jpg)](http://the-witness.net/news/wp-content/uploads/2012/05/DSCN0958.jpg)

### The Depth Jam idea

Now, we come to the actual Depth Jam.  We settled on the basic idea very quickly: the jam would occur in a relaxing retreat-like environment.  There would be a limited number of participants; four seemed like a good number.  Each participant would have a good game that he has already been working on for a while, and which presents some deep and interesting problem he would like to solve; this problem serves as a focus for discussion.  The fact that every particpant has a game under discussion means that every participant has "skin in the game", which keeps discussion tethered and unfrivolous.

I'd like to emphasize this last point because it can be subtle but it is crucial.  Suppose some people are showing their games and being criticized and generally having a rough time due to all the stress that happens naturally when having one's creation dissected; and meanwhile, the people who are criticizing do not have any obligations, and they are just tossing in comments from the peanut gallery.  This situation creates a weird imbalance.  The comments and criticism will not be as thoughtful as they could be, yet they will be taken very hard by the people showing the games.

If everyone is having their creations dissected, there's only one class of attendee instead of two.  It is easier to empathize and avoid unnecessary harshness.  People are going to be more careful that their ideas and criticisms are thoughtful, because they are acutely aware of wanting careful input when it comes to their own game.

### The Format

Our first proposal for the Depth Jam had us spending one entire day on each game, so that we could dive into each game at maximum depth without context-switching.  However, as the idea churned, we decided it would be beneficial to allow some iteration.  Why not split the day into two time slots, so that each game gets half a day and we cycle through the four games twice?  This would allow time to modify the games based on the discussion, which would give the discussion even more teeth: now we're not just talking about a particular problem in a particular game (with some kind of tendency to wax philosophical), we're actually figuring out how the author will address the problem here at the retreat, with the results of that approach to be plainly visible in the next session.

In our pre-jam planning meeting, we decided to go even further this way, breaking each day into four slots, cycling through all the games four times (so that each game had a two-hour slot each day).  This seemed to work pretty well and it allowed a lot of iteration, but it might have been excessive.  Daniel thinks there was too much context-switching and he might have been able to think more effectively if given more stability.  My impression is that the talking was great for the first couple of days and degraded in quality toward the end (but was still worthwhile even then).  At least two attendees did not have a problem with this, though, and found that the final discussions were very valuable for them.

For the next jam I would propose a mixed format: we'd start with two 4-slot days, just like we did this time, followed by a day with no-talking, all-working-and-quiet-and-taking-a-walk, followed by a final 4-slot day.  (Or, perhaps I would lengthen the retreat to 5 days and put the rest day in the middle.)

The nice thing about the 4-slot-per-day format, which would not have been true of the 2-slot-per-day format, is that it gives us the maximum amount of calendar time for ideas to stew between iterations.  I have long been appricative of the role of calendar time in good design. Sometimes it doesn't matter how many hours you pack in trying to get things done; the good ideas will arrive unpredictably, and maybe you just need to allow time for this to happen.  I was curious whether this principle would also be true on the timescale of a 4-day retreat.  For me, at least, it was; I got my best idea in the shower on the morning of day 3, in response to discussions we'd had on day 2.  During my session on day 3 we discussed and refined the idea, and on day 4 I showed an implementation of it.

### Creature Comforts

We spent some money renting a nice beach house and ordering catered food; the cost for the event was around $5000.  Chris goes into more detail about this in his write-up.  You don't need to spend any money on an event like this, but if you can afford it I recommend spending some money to help create a nice environment that minimizes stress and factors away concerns like "what are we going to eat for dinner" and "who is going to do the dishes".  The purpose is twofold: first, it helps you focus on the subject at hand; second, the minimization of external stresses helps you deal with the potential added stresses of working really hard and disagreeing with people all the time.

If you think that the Depth Jam will help you make more headway on even one deep problem than you would have otherwise, and thus make your game better, it's easy to think that the game will also sell a little better and that costs in the neighborhood of $1250 per attendee are easily justified.

[![](http://the-witness.net/news/wp-content/uploads/2012/05/DSCN0965-512x384.jpg)](http://the-witness.net/news/wp-content/uploads/2012/05/DSCN0965.jpg)

### Attitude

Discussions can easily turn into arguments, or at least energy-sucking disagreements.  As peoples' energy gets drained, they become more irritable, so there's a feedback loop lurking here.  A little bit of this happened at our Depth Jam, but we saw it happening and course-corrected, so that the final day's discussion was reasonable.

Prior to the jam, though, we had not thought much about this.  I think it would be helpful in future for the attendees to go in knowing that irritability is likely to happen; the mere fact of this awareness probably helps the situation, and anyway, a little bit of psychologically-aware pacing at the beginning would have gone a long way.

### Games and Attendees

It's very important the attendees be capable both of participating in good discussions and acting on the discussions to improve their games within a short timeframe.  This latter requirement basically limits attendees to being competent designer/programmers.  If someone can't program, it's hard to see how he can participate meaningfully in this style of depth jam, because it would be very hard to iterate.  Possibly if someone is a level/world/puzzle designer who can build scenarios quickly in UDK or Unity or whatever, it can be made to work, but I still think that person would be feeling the limitations of being unable to make algorithmic changes.

I don't think that having teams of people would work, at least not for the format described here, because it would dilute the energy and bog down the iteration process.  If you have one designer and one programmer trying to do the job that the other people are doing as single designer/programmers, your duo is probably going to have a hard time keeping up.  If the jam is made up entirely of duos, it's going to make discussions a lot messier and lower-energy (twice as many people talking about the same number of games).  At least one of us felt that four people was already too many for high-quality discussions, because you keep having interesting ideas but have to wait for other people to stop talking in order to say them, and by that time the discussion may have moved on to a different topic.

[![](http://the-witness.net/news/wp-content/uploads/2012/05/DSCN0883-512x384.jpg)](http://the-witness.net/news/wp-content/uploads/2012/05/DSCN0883.jpg)

We have tossed around some ideas about how to scale the jam to larger groups, but haven't come up with anything that is fully convincing yet.

It's important that the games be high-quality efforts that pose problems that everyone will be interested in.  We were fortunate to have four very interesting games: [Miegakure](http://marctenbosch.com/miegakure/), a puzzle-platformer in four dimensions; [Storyteller](http://www.ludomancy.com/storyteller.php), a game about building stories through character interactions; [Spy Party](http://www.spyparty.com/), a heavily player-skill-oriented game about subtlety and deception in human behavior; and [The Witness](http://the-witness.net), a first-person puzzle game with a heavy emphasis on nonverbal communication.

If time permits I may do a detailed write-up of the issues we discussed for each game and the resolutions we reached (though care must be taken here, as we don't want to disclose aspects of these games that the designers would rather keep secret).

### Conclusions

I am happy with the way this first Depth Jam went.  I think we can certainly tweak the format to improve it, but already it is a useful tool in my further development as a game designer.  I got much more out of this four-person, four-day event than I do from attending a conference.  It seems appropriate to me to do a Depth Jam every six months.  Provided we are organized enough to get the next one together, we'll adjust the format and see how it goes!

[![](http://the-witness.net/news/wp-content/uploads/2012/05/DSCN0908-512x384.jpg)](http://the-witness.net/news/wp-content/uploads/2012/05/DSCN0908.jpg)

See also:

[Chris Hecker's write-up](http://chrishecker.com/The_Depth_Jam)

[Daniel Benmergui's write-up](http://www.ludomancy.com/blog/2012/05/25/depth-jam/)

[Miegakure web site](http://marctenbosch.com/miegakure/)
