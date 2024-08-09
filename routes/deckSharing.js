import { Router } from 'express';
import { deckSharingErrors } from '../responses/deckSharingErrors.js';
import { CreateDeck, DeleteDeck, GetDeck, GetDeckOwner, GetLikedDecks, GetUserBanState, GetUserDecks, LikeDeck, SearchDecks, UnlikeDeck, UpdateDeck } from '../database.js';
import { SetErrorResponse } from '../responses/ResponseData.js';
import { SanitizeFulltextSearch } from '../utils/string.js';
import { cardsLimit, deckDescriptionCharLimit, deckTitleCharLimit, stagesLimit, usersLimit } from '../public/constants/deckData.js';
import { CheckUserDefined } from '../utils/checkDefined.js';
import { userErrors } from '../responses/requestErrors.js';
import { stages } from '../public/constants/stageData.js';
import { uniqueCards } from '../cards/cardManager.js';
import { GenerateNanoId } from '../nanoIdManager.js';

const router = Router();

//req: deckId
//res: deck
router.post("/GetDeck", async (req, res) => {
    try{
        var deckId = req.body.deckId;
        if (typeof(deckId) !== 'undefined' && typeof(deckId) !== 'string') return SetErrorResponse(res, deckSharingErrors.deckIdWrongFormat);
        var result = await GetDeck(deckId);

        res.status(200).send(result);
    } catch(error){
        console.log(error)
        res.status(500).send(error);
    }
});

//req: userId (optional), offset (optional)
//res: decks
router.post("/GetUserDecks", async (req, res) => {
    try{
        var userId = req.body.userId;
        var offset = (req.body.offset) ? req.body.offset : 0;
        if (typeof(offset) !== 'number') offset = 0;
        if (offset < 0) offset = 0;

        if (!userId){
            if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
            userId = req.session.user;
        }
        var result = await GetUserDecks(userId, offset);

        res.status(200).send(result);
    } catch(error){
        console.log(error)
        res.status(500).send(error);
    }
});

//req: searchOptions, offset (optional)
//res: decks
router.post("/SearchDecks", async (req, res) => {
    try{
        var searchOptions = req.body.searchOptions;
        var offset = (req.body.offset) ? req.body.offset : 0;
        if (typeof(offset) !== 'number') offset = 0;
        if (offset < 0) offset = 0;

        if (typeof (searchOptions) !== 'object' || Array.isArray(searchOptions) || searchOptions === null) return false;
;
        if (typeof(searchOptions.input) !== 'undefined' && typeof(searchOptions.input) !== 'string') return SetErrorResponse(res, deckSharingErrors.inputWrongFormat);
        if (searchOptions.input){
            if (searchOptions.input.length > 32) return SetErrorResponse(res, deckSharingErrors.inputWrongFormat);
            if (searchOptions.input.length > 0) searchOptions.input = SanitizeFulltextSearch(searchOptions.input);
        }

        if (typeof(searchOptions.users) !== 'undefined' && !Array.isArray(searchOptions.users)) return SetErrorResponse(res, deckSharingErrors.usersWrongFormat);
        if (searchOptions.users){
            if (searchOptions.users.length > usersLimit) return SetErrorResponse(res, deckSharingErrors.usersWrongFormat);
            if (!searchOptions.users.every((element) => typeof(element) === 'string')) return SetErrorResponse(res, deckSharingErrors.usersWrongFormat);
        }

        if (typeof(searchOptions.cards) !== 'undefined' && !Array.isArray(searchOptions.cards)) return SetErrorResponse(res, deckSharingErrors.cardsWrongFormat);
        if (searchOptions.cards){
            if (searchOptions.cards.length > cardsLimit) return SetErrorResponse(res, deckSharingErrors.cardsWrongFormat);
            if (!searchOptions.cards.every((element) => typeof(element) === 'number')) return SetErrorResponse(res, deckSharingErrors.cardsWrongFormat);
        }

        if (typeof(searchOptions.stages) !== 'undefined' && !Array.isArray(searchOptions.stages)) return SetErrorResponse(res, deckSharingErrors.stagesWrongFormat);
        if (searchOptions.stages){
            if (searchOptions.stages.length > stagesLimit) return SetErrorResponse(res, deckSharingErrors.stagesWrongFormat);
            if (!searchOptions.stages.every((element) => typeof(element) === 'number')) return SetErrorResponse(res, deckSharingErrors.stagesWrongFormat);
        }

        if (typeof(searchOptions.minRank) !== 'undefined' && typeof(searchOptions.minRank) !== 'string') return SetErrorResponse(res, deckSharingErrors.rankWrongFormat);
        if (typeof(searchOptions.startDate) !== 'undefined' && typeof(searchOptions.minRank) !== 'number') return SetErrorResponse(res, deckSharingErrors.startDateWrongFormat);
        if (typeof(searchOptions.endDate) !== 'undefined' && typeof(searchOptions.endDate) !== 'number') return SetErrorResponse(res, deckSharingErrors.endDateWrongFormat);

        var result = await SearchDecks(searchOptions, offset);

        res.status(200).send(result);
    } catch(error){
        console.log(error)
        res.status(500).send(error);
    }
});

//req: offset (optional)
//res: decks
router.post("/GetLikedDecks", async (req, res) => {
    try{
        const userId = req.session.user;

        var offset = (req.body.offset) ? req.body.offset : 0;
        if (typeof(offset) !== 'number') offset = 0;
        if (offset < 0) offset = 0;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);

        var result = await GetLikedDecks(userId, offset);

        res.status(200).send(result);
    } catch(error){
        console.log(error)
        res.status(500).send(error);
    }
});

//todo from this point

//req: deck
//res: deckId
router.post("/CreateDeck", async (req, res) => {
    try{
        const userId = req.session.user;
        const deck = req.body.deck;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
        var banned = GetUserBanState(userId);
        if (banned) return SetErrorResponse(res, userErrors.banned);

        if (!CheckDeckLegality(deck)) return SetErrorResponse(res, deckSharingErrors.deckWrongFormat);

        //create ids
        deck.ownerId = userId;
        deck.id = GenerateNanoId();

        await CreateDeck(deck);

        res.status(200).send(deck.id);
    } catch(error){
        console.log(error)
        res.status(500).send(error);
    }
});

//req: deck
router.post("/UpdateDeck", async (req, res) => {
    try{
        const userId = req.session.user;
        const deck = req.body.deck;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
        var banned = GetUserBanState(userId);
        if (banned) return SetErrorResponse(res, userErrors.banned);

        if (!CheckDeckLegality(deck)) return SetErrorResponse(res, deckSharingErrors.deckWrongFormat);
        if (GetDeckOwner(deck.id) != userId) return SetErrorResponse(res, deckSharingErrors.notOwnerOfDeck);

        deck.ownerId = userId;

        await UpdateDeck(deck);

        res.status(200).send({});
    } catch(error){
        console.log(error)
        res.status(500).send(error);
    }
});

//req: deckId
router.post("/LikeDeck", async (req, res) => {
    try{
        const userId = req.session.user;
        const deckId = req.body.deckId;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);

        if (typeof(deckId) !== 'undefined' && typeof(deckId) !== 'string') return SetErrorResponse(res, deckSharingErrors.deckIdWrongFormat);

        await LikeDeck(userId, deckId);

        res.status(200).send({});
    } catch(error){
        console.log(error)
        res.status(500).send(error);
    }
});

//req: deckId
router.post("/DeleteDeck", async (req, res) => {
    try{
        const userId = req.session.user;
        const deckId = req.body.deckId;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
        var banned = GetUserBanState(userId);
        if (banned) return SetErrorResponse(res, userErrors.banned);

        if (typeof(deckId) !== 'undefined' && typeof(deckId) !== 'string') return SetErrorResponse(res, deckSharingErrors.deckIdWrongFormat);
        if (GetDeckOwner(deckId) != userId) return SetErrorResponse(res, deckSharingErrors.notOwnerOfDeck);

        await DeleteDeck(deckId);

        res.status(200).send({});
    } catch(error){
        console.log(error)
        res.status(500).send(error);
    }
});

//req: deckId
router.post("/UnlikeDeck", async (req, res) => {
    try{
        const userId = req.session.user;
        const deckId = req.body.deckId;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);

        if (typeof(deckId) !== 'undefined' && typeof(deckId) !== 'string') return SetErrorResponse(res, deckSharingErrors.deckIdWrongFormat);

        await UnlikeDeck(userId, deckId);

        res.status(200).send({});
    } catch(error){
        console.log(error)
        res.status(500).send(error);
    }
});

export default router;

function CheckDeckLegality(deck){
    if (typeof (deck) !== 'object' || Array.isArray(deck) || deck === null) return false;

    if (typeof (deck.title) !== 'string') return false;
    if (deck.title.length < 1 || deck.title.length > deckTitleCharLimit) return false;

    if (typeof (deck.description) !== 'string' && typeof (deck.description) !== 'undefined') return false;
    if (deck.description){
        if (deck.description.length < 1 || deck.description.length > deckDescriptionCharLimit) return false;
    }

    if (!Array.isArray(deck.cards)) return false;
    if (deck.cards.length != 15) return false;
    if (!deck.cards.every((element) => typeof(element) === 'number') && element > 0 && element < uniqueCards) return false;

    if (typeof (deck.stage) !== 'number' && typeof (deck.stage) !== 'undefined') return false;
    if (!deck.stage) deck.stage = stages.unpicked;
    if (!Object.values(stages).indexOf(deck.stage) > -1) return false;

    return true;
}