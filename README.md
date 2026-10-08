# Nourish AI

Build a modern, responsive AI Nutrition & Fitness Tracking Website that helps users track calories, protein, carbohydrates, fats, water, weight and overall nutrition.

The website should have a premium, clean, modern dashboard UI that is extremely easy for beginners to use. Make it feel like a professional fitness/nutrition app rather than a basic calculator.

1. MAIN DASHBOARD

Create a personalized dashboard showing today's nutrition progress.

At the top display:

Today's Calories

Protein

Carbohydrates

Fat

Fiber

Water

Current Weight

Daily Goal

Use attractive progress rings, progress bars and cards.

Example:

Calories
1,850 / 2,400 kcal

Protein
92 / 120 g

Carbs
210 / 300 g

Fat
58 / 75 g

Each card should visually show how much has been consumed versus the daily target.

Also show:

Calories remaining

Protein remaining

Today's meals

Today's water intake

Weight progress

Goal progress

2. FOOD TRACKING

Create an easy Add Food system.

Users should be able to:

Search for food

Select a food

Enter quantity

Select unit

Add it to breakfast/lunch/dinner/snacks

IMPORTANT:

Food quantity must be customizable.

Allow quantities such as:

50 g

100 g

150 g

200 g

250 g

500 g

1 kg

Also support:

1 piece

2 pieces

1 banana

1 egg

1 cup

1 tablespoon

1 serving

When the user changes the quantity, automatically recalculate:

Calories
Protein
Carbohydrates
Fat
Fiber

For example:

Chicken Breast
100 g → 165 kcal, 31 g protein

200 g → automatically calculate approximately double the nutrition.

Do NOT hard-code the nutrition values into the frontend. Create a proper food database/data structure so foods and nutritional values can be expanded later.

3. MEAL CATEGORIES

Allow users to add food under:

Breakfast

Morning Snack

Lunch

Evening Snack

Dinner

Other

Each meal should show:

Food name
Quantity
Calories
Protein
Carbs
Fat

Allow users to:

Edit quantity

Delete food

Duplicate food

Quickly add the same food again

4. AI FOOD ASSISTANT

Add a major feature called:

"AI Nutrition Assistant"

Create a chat interface where users can ask things like:

"What should I eat for breakfast?"

"Give me a 500 calorie high protein meal."

"I need 30g protein under 300 calories."

"What can I eat for weight gain?"

"Give me a vegetarian dinner."

"How can I reach my remaining protein today?"

"Suggest a meal under ₹150."

The AI should analyze the user's:

Weight

Height

Age

Gender

Goal

Daily calorie target

Protein target

Food preferences

Dietary restrictions

Today's consumed nutrition

Then provide personalized suggestions.

The AI should also be able to recommend foods based on the remaining calories/macros for the day.

Example:

User has consumed:

1,700 / 2,400 kcal
80 / 120 g protein

AI should respond with suggestions that approximately fit the remaining:

700 kcal
40 g protein

5. GOAL SYSTEM

During onboarding, ask the user what their goal is:

Weight Loss

Help the user maintain a calorie deficit.

Weight Gain

Help the user maintain a calorie surplus.

Muscle Gain

Prioritize sufficient protein and appropriate calories.

Maintain Weight

Help maintain current weight.

General Fitness

Balanced nutrition tracking.

Allow the user to change the goal later.

6. PERSONAL PROFILE

Create a profile setup page asking for:

Age

Gender

Height

Weight

Activity Level

Goal

Target Weight

Dietary Preference

Dietary preferences:

Vegetarian

Non-Vegetarian

Vegan

Eggetarian

Custom

Activity levels:

Sedentary

Lightly Active

Moderately Active

Very Active

Athlete

Use this information to calculate an estimated daily calorie target and recommended protein intake.

Clearly label calculated values as estimates and allow users to manually adjust their targets.

7. WEIGHT TRACKING

Create a weight tracking section.

Users can enter their weight daily/weekly.

Display:

Current weight

Starting weight

Target weight

Weight change

Progress percentage

Create a clean weight graph showing:

Date → Weight

Example:

Week 1 → 51 kg
Week 2 → 51.5 kg
Week 3 → 52 kg

Also show whether the user's progress is moving toward their goal.

8. NUTRITION ANALYTICS

Create an Analytics page.

Show:

Daily calories

Weekly average calories

Protein average

Carb average

Fat average

Weight changes

Water intake

Goal progress

Use attractive charts and graphs.

Allow users to switch between:

7 Days
30 Days
3 Months
1 Year

9. WATER TRACKING

Create a simple water tracker.

Example:

💧 1.8 L / 2.5 L

Allow users to quickly add:

+250 ml
+500 ml
+750 ml
+1 L

Show daily progress visually.

10. AI MEAL PLANNER

Create an AI-powered meal planner.

User can select:

Goal

Calories

Protein target

Vegetarian/non-vegetarian

Number of meals

Budget

Foods they like/dislike

AI generates a complete daily plan:

Breakfast
Lunch
Snack
Dinner

Each meal should show:

Food
Quantity
Calories
Protein
Carbs
Fat

Include a button:

"Add All to Today's Tracker"

which automatically adds the selected meals to the user's nutrition log.

11. FOOD SEARCH

Create a powerful food search system.

When searching "rice", show relevant foods such as:

White Rice
Brown Rice
Basmati Rice
Cooked Rice
etc.

Every food result should display nutrition per 100 g as the default.

When the user changes the quantity to 200 g, automatically calculate the nutrition.

Use a reusable calculation system:

nutrition for selected quantity =
nutrition per 100 g × selected grams / 100

For pieces/servings, store appropriate serving weights or nutrition values.

12. QUICK ADD

Add quick buttons to make tracking extremely easy:

Food

Water

Weight

Meal

Also add a "Recently Added" section so users can quickly add foods they frequently eat.

13. DASHBOARD DESIGN

Design should be:

Modern

Minimal

Premium

Mobile-first

Responsive

Fast

Easy to understand

Use:

Rounded cards

Smooth animations

Progress rings

Clean typography

Beautiful charts

Subtle gradients

Dark/light mode

Good spacing

Modern icons

Avoid making the interface too complicated.

The most important information should be visible immediately when the user opens the dashboard.

14. NAVIGATION

Desktop sidebar:

Dashboard
Food
Meals
AI Assistant
Meal Planner
Progress
Analytics
Profile
Settings

Mobile navigation should use a bottom navigation bar with the most important sections.

15. DATABASE / BACKEND

Create a proper backend architecture.

Store:

Users
User profiles
Foods
Food nutrition
Meals
Meal items
Daily nutrition logs
Weight history
Water logs
Goals
AI meal plans

Each user's data must be isolated securely.

Do not expose API keys in frontend code.

16. AI API ARCHITECTURE

Build the AI functionality so that the AI API can be connected securely through a backend/serverless function.

Never place an AI API key directly in frontend code.

Create a clean API/service layer such as:

/api/ai/nutrition
/api/ai/meal-plan
/api/ai/food-recommendation

The frontend should communicate with the backend rather than directly exposing the API key.

17. SMART DAILY INSIGHTS

At the bottom of the dashboard create:

"Today's AI Insight"

Example:

"You have 42 g protein remaining today. Consider adding 150 g chicken breast and Greek yogurt to reach your target."

Also show warnings such as:

"You are close to your calorie limit."

"Your protein intake is lower than your target."

"Your water intake is below today's goal."

Keep recommendations personalized to the user's actual data.

18. ONBOARDING

When a new user enters the website:

Step 1 → Age, gender, height, weight

Step 2 → Activity level

Step 3 → Goal

Step 4 → Target weight

Step 5 → Dietary preference

Step 6 → Calculate estimated calorie and protein targets

Step 7 → Show personalized dashboard

Make onboarding visually attractive and simple.

19. IMPORTANT FUNCTIONAL REQUIREMENTS

This must be a REAL functional application, not just a static UI.

Make sure:

Food quantities actually change nutrition values.

Calories/macros update immediately.

Daily totals update automatically.

Goals affect recommendations.

Weight history is saved.

Water tracking is saved.

Food logs persist after refresh.

Dashboard reflects actual user data.

Charts use real stored data.

AI recommendations use the user's actual nutrition data.

Users can edit/delete entries.

Responsive design works on mobile, tablet and desktop.

20. SAMPLE DASHBOARD

Create a polished dashboard similar to:

GOOD MORNING 👋

Your Nutrition Today

Calories
1,850 / 2,400 kcal

Protein
92 / 120 g

Carbs
210 / 300 g

Fat
58 / 75 g

Today's Meals

Breakfast
Oats 100 g
Banana 1
Eggs 2

Lunch
Rice 200 g
Chicken 150 g
Vegetables 100 g

Dinner
...

💧 Water
1.8 / 2.5 L

⚖️ Weight
51.5 kg → Target 60 kg

🤖 AI INSIGHT

"You need approximately 28 g more protein today. Here are 3 foods that can help..."

21. EXTRA FEATURES

Add:

Favorite foods

Recently eaten foods

Custom foods

Custom meals

Meal templates

Food diary

Daily streak

Nutrition goals

Notifications/reminders

Dark mode

Export nutrition data

Search and filtering

AI-generated grocery list

22. DESIGN PRIORITY

The final website should feel like a combination of:

MyFitnessPal + modern AI assistant + premium fitness dashboard

but with its own unique design.

Prioritize:

Easy food logging

Accurate quantity-based nutrition calculation

Clear calorie/protein/macros dashboard

Weight gain/loss tracking

AI nutrition assistant

AI meal planning

Beautiful modern UI

Fast and responsive experience

Before changing existing components, inspect the current project structure and reuse existing components where possible. Do not break existing navigation, authentication, database connections, or other working features.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1de236fd-1923-439b-85d6-7b09cea79033).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
