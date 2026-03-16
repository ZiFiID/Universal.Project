local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

local searchKeyword = "higuruma"
local nextCursor = nil

local function fetchPage()
    local url = "https://universal-project-rho.vercel.app/api/emote?q="..searchKeyword
    if nextCursor then
        url = url.."&cursor="..nextCursor
    end

    local success, data = pcall(function()
        return HttpService:JSONDecode(game:HttpGet(url))
    end)

    if not success then
        warn("Gagal fetch API:", data)
        return
    end

    -- Print hasil page ini
    for i, emote in ipairs(data.results) do
        print(i, emote.name, emote.animationId, emote.price, emote.creator)
    end

    -- Simpan cursor page berikutnya
    nextCursor = data.nextCursor
    if not nextCursor then
        print("Sudah page terakhir.")
    else
        print("Next cursor:", nextCursor)
    end
end

-- Fetch pertama
fetchPage()
-- Fetch page berikutnya
if nextCursor then fetchPage() end
