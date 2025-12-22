# Backend Endpoint Required: Mark Reward as Used

## Endpoint Details

**POST** `/api/nilemiles/nilemiles/use-reward`

## Request Body

```json
{
  "userId": "string",
  "rewardKey": "string"
}
```

## What it should do:

1. Find the Nile Miles document for the given `userId`
2. Find the reward in the `redeemed` array where `rewardKey` matches
3. Update that reward object to set `used: true`
4. Save the updated document back to the database

## Example Logic (pseudo-code):

```javascript
router.post("/use-reward", async (req, res) => {
  const { userId, rewardKey } = req.body;

  // Get the Nile Miles document
  const nileMilesDoc = await database.getDocument(
    databaseId,
    nileMilesCollectionId,
    userId
  );

  // Parse the redeemed array (it might be a JSON string)
  let redeemed = [];
  if (typeof nileMilesDoc.redeemed === "string") {
    redeemed = JSON.parse(nileMilesDoc.redeemed);
  } else if (Array.isArray(nileMilesDoc.redeemed)) {
    redeemed = nileMilesDoc.redeemed;
  }

  // Find and mark the reward as used
  const rewardIndex = redeemed.findIndex((r) => r.rewardKey === rewardKey);
  if (rewardIndex !== -1) {
    redeemed[rewardIndex].used = true;
  }

  // Update the document (stringify if needed)
  await database.updateDocument(databaseId, nileMilesCollectionId, userId, {
    redeemed: JSON.stringify(redeemed), // or redeemed if your DB accepts arrays
  });

  res.json({ success: true, message: "Reward marked as used" });
});
```

## Testing

After implementing, test by:

1. Redeeming a reward
2. Completing a checkout with that reward
3. Going back to checkout - the reward should no longer appear in the dropdown
