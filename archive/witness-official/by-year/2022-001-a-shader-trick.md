# A Shader Trick

- **作者**：Jonathan Blow
- **日期**：2022-02-10 17:04 UTC
- **分类**：Uncategorized
- **原文**：http://the-witness.net/news/2022/02/a-shader-trick/
- **来源**：the-witness.net 官方开发博客（文章页全文）

---

*(I was sending an email today about a simple trick we use in the shader system, and it seemed easy and useful to share that email publicly, so, here you go!)*



There's one other place where fog snaps right now, and that is in time -- it is probably pretty easy to fix, though the explanation might be a little unexpected so I am Ccing it to the team as a general knowledge transfer thing.



In general, with floating point numbers, there is a problem with loss of precision when you do computations involving large numbers added to small numbers; the small numbers tend to get dropped and go toward zero. This is a general thing about computers, not just graphics (it is the price we pay for being able to pretend we can store real numbers in small amounts of memory). Most of the time it's not an issue and programmers don't think about it, but there are some times when it can be an issue.



In shaders, we often want to have a time variable, controlled by the CPU, that we can use to help generate effects. That time variable counts upward, maybe from the time the level started, or the time the game started. If that number is measured in seconds, then after 10 minutes it will be around 600, after 2 hours it will be 7200, etc. If someone leaves the game running for 3 days (a certification requirement on consoles!), it would get up over 250,000.



Those numbers don't seem super big, but at the same time, we also deal with numbers that are small. If the game is running at 60fps (which on PC these days is considered maybe a slow frame rate!), that's 0.017 seconds per frame, and we might be doing math that involves both this dt and the current time. At which point the ratio of the current time to the frame time is like 250,000 / (1/60) = 15 million. That is really very high and a recipe for all kinds of numerical problems you don't expect -- if you add the delta time to the current time, in a 32-bit float, the delta time is almost completely destroyed because there is not enough precision in the number. Long before this time, you'd start to see jitteriness in animation, things not matching up to where you'd expect them to be, etc.



One way to solve this is not to let the current time grow indefinitely -- at some point, you reset it to 0. You could pick a fixed amount of time, like I don't know, every minute, and at the end of the minute the time is back at 0 and you keep going. But if you want your effects to be seamless, they all have to match up exactly at the 1-minute boundary, which makes tuning things difficult and annoying. For example, if you want to make a cosine wave that is seamless across time, you can make the wave with a period of 1 minute, or half a minute, or 1/3 a minute, etc, and firstly this is annoying because when designers want to tune stuff, they have to know this, and it's unwieldy and confusing, and secondly, these numbers cannot be represented exactly in floating-point numbers either, so you're adding imprecision that way.



But there is an old graphics programmer trick that solves this very cleanly, that I think has been around for a long time (I first heard of it from Ignacio when we were working on The Witness).



For our cosine wave example mentioned above, we are going to be evaluating some function like cos(freq*time*2*PI), where 'time' is just the wall clock time according to the game, and 'freq' is some parameter controlling the frequency of the cosine wave, that we want it to be very easy for designers to adjust without introducing problems.



The constraint you have to meet, for your cosine waves to match up when the timer resets, is that they all have to evaluate to 1 at whatever the max time is -- because when you reset to time = 0, you will get cos(freq*0*2*PI), which is 1. So cos(freq*time_max*2*PI) also has to be 1, in other words, the cosine has to have gone around the circle an integer number of times. Since we have a factor of 2*PI in there, this means that our wave will be flawless any time freq*time_max is an integer.



How do we ensure that, easily, in a way that people don't have to think about? Pick, for time_max, a number of seconds that is 10 to some integer power -- for example, 1000. Then, any number you type into a tweak file, that has no more than 3 digits after the decimal, will result in an integer number of times around the circle. For example, if freq = 9.876, we get cos(9.876*1000*2*PI) == cos(9876*2*PI) == 1. This works for any number you pick with 3 digits after the decimal. If you need 4 digits, make time_max 10000, and so forth. If we are reading values from a tweak file, we can round them to the nearest 3 digits before sending them to the shader (and maybe output a warning, that the digits aren't being used, if the rounded number is appreciably different from the input number, to remind people of this system).



This works with any periodic function, we just used cosine here as an example. For linear shifts, like scrolling uv coordinates or whatnot, it's similar -- if you have uv coordinates from 0 to 1, you just need to make sure shift_rate*time_max is an integer in order for the scrolling to be perfect when the time resets. Similarly for the time parameter used to index a flipbook animation.



So the reason the fog is snapping after you play for a while is that the time sent to the shader system gets reset to 0 every 1000 seconds but the fog doesn't know about this. And the reason for the resetting is to make sure we maintain good precision in the time-based effects in the shaders.
